import { Injectable, BadRequestException } from '@nestjs/common';
import { Prisma } from '../../src/prisma/generated/client.js';
import type { Registration, Reservation } from '../../src/prisma/generated/client.ts';
import { PrismaService } from '../prisma/prisma.service.js';
import {
    ReservationSlotRow,
    ReservationSlotsService,
    toMidnightUTC,
} from '../reservation-slots/reservation-slots.service.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { GetRegistrationsQueryDto } from './dto/get-registrations-query.dto.js';

/** Slot-search offset order */
const OFFSETS = [0, -1, 1, -2, 2] as const;

type CreateRegistrationResult = {
    registration: Registration;
    reservation: Reservation;
};

@Injectable()
export class RegistrationsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly reservationSlotsService: ReservationSlotsService,
    ) {}

    private buildDateRange(date: string) {
        const parsed = new Date(date);

        if (Number.isNaN(parsed.getTime())) {
            throw new BadRequestException(`Invalid date: ${date}`);
        }

        const from = new Date(
            Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()),
        );

        const to = new Date(from);
        to.setUTCDate(to.getUTCDate() + 1);

        return {
            gte: from,
            lt: to,
        };
    }

    create(dto: CreateRegistrationDto): Promise<CreateRegistrationResult> {
        const plannedDate = toMidnightUTC(new Date(dto.plannedDate));
        const now = new Date();

        return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // 1. Persist the patient registration
            const registration = await tx.registration.create({
                data: {
                    name: dto.name,
                    surname: dto.surname,
                    phone: dto.phone,
                    email: dto.email,
                    plannedDate,
                },
            });

            // 2. Search for a free slot using the offset order
            let assignedSlot: ReservationSlotRow | null = null;

            for (const offset of OFFSETS) {
                const candidate = new Date(plannedDate);
                candidate.setUTCDate(candidate.getUTCDate() + offset);

                const rows = await tx.$queryRaw<ReservationSlotRow[]>`
                    SELECT id, date, "totalCapacity", "usedCapacity", "createdAt"
                    FROM "ReservationSlot" rs
                    WHERE
                        rs.date = ${candidate}
                        AND rs."usedCapacity" < rs."totalCapacity"
                        AND rs.availableFrom <= ${now}
                    LIMIT 1
                `;

                if (rows.length > 0) {
                    assignedSlot = rows[0];
                    break;
                }
            }

            // 3. Create reservation record
            if (assignedSlot) {
                await tx.reservationSlot.update({
                    where: { id: assignedSlot.id },
                    data: { usedCapacity: { increment: 1 } },
                });

                const reservation = await tx.reservation.create({
                    data: {
                        registrationId: registration.id,
                        reservationSlotId: assignedSlot.id,
                        assignedDate: assignedSlot.date,
                        status: 'CREATED',
                    },
                });

                return { registration, reservation };
            } else {
                const reservation = await tx.reservation.create({
                    data: {
                        registrationId: registration.id,
                        reservationSlotId: null,
                        assignedDate: null,
                        status: 'DENIED',
                    },
                });

                return { registration, reservation };
            }
        });
    }

    findAll(query?: GetRegistrationsQueryDto) {
        const where: Record<string, unknown> = {};

        if (query?.email) {
            where.email = {
                contains: query.email,
            };
        }

        if (query?.surname) {
            where.surname = {
                contains: query.surname,
            };
        }

        if (query?.plannedDate) {
            where.plannedDate = this.buildDateRange(query.plannedDate);
        }

        if (query?.status || query?.assignedDate) {
            const reservationWhere: Record<string, unknown> = {};

            if (query.status) {
                reservationWhere.status = query.status;
            }

            if (query.assignedDate) {
                reservationWhere.assignedDate = this.buildDateRange(query.assignedDate);
            }

            where.reservation = {
                is: reservationWhere,
            };
        }

        return this.prisma.registration.findMany({
            where,
            include: {
                reservation: {
                    include: {
                        reservationSlot: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: number) {
        return this.prisma.registration.findUnique({
            where: { id },
            include: { reservation: { include: { reservationSlot: true } } },
        });
    }
}
