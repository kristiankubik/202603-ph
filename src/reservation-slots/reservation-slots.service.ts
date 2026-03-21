import { Injectable, BadRequestException } from '@nestjs/common';
import type { ReservationSlot } from '../prisma/generated/client.js';
import { CreateReservationSlotsDto } from './dto/create-reservation-slots.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

/** Normalise any Date to midnight UTC so slot dates are calendar-day keys. */
export function toMidnightUTC(d: Date): Date {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export interface ReservationSlotRow {
    id: number;
    date: Date;
    totalCapacity: number;
    usedCapacity: number;
    createdAt: Date;
}

@Injectable()
export class ReservationSlotsService {
    constructor(private readonly prisma: PrismaService) {}

    async create(date: Date, slotsPerDay: number, availableFrom: Date): Promise<ReservationSlot> {
        const normalized = toMidnightUTC(date);
        return this.prisma.reservationSlot.upsert({
            where: { date: normalized },
            create: {
                date: normalized,
                totalCapacity: slotsPerDay,
                availableFrom: new Date(availableFrom),
            },
            update: {},
        });
    }

    async createOneOrMany(
        body: CreateReservationSlotsDto | CreateReservationSlotsDto[],
    ): Promise<ReservationSlot | ReservationSlot[]> {
        if (Array.isArray(body)) {
            return this.createBulk(body);
        }
        return this.create(body.date, body.slotsPerDay, body.availableFrom);
    }

    async createBulk(items: CreateReservationSlotsDto[]): Promise<ReservationSlot[]> {
        return Promise.all(
            items.map((item) => this.create(item.date, item.slotsPerDay, item.availableFrom)),
        );
    }

    async findByDate(date: string, availableFrom: Date) {
        const parsedDate = new Date(date);
        if (Number.isNaN(parsedDate.getTime())) {
            throw new BadRequestException('Invalid date');
        }
        const normalized = toMidnightUTC(parsedDate);

        const res = await this.prisma.reservationSlot.findUnique({
            where: {
                date: normalized,
                availableFrom: { lte: availableFrom },
            },
        });

        return res ? [res] : [];
    }

    /** List all slots, optionally filtered by year/month. */
    findAll(params?: {
        year?: number;
        month?: number;
        availableFrom?: Date;
    }): Promise<ReservationSlot[]> {
        const where: { date?: { gte: Date; lt: Date }; availableFrom?: { lte: Date } } = {};

        if (params?.year && params?.month) {
            where.date = {
                gte: new Date(Date.UTC(params.year, params.month - 1, 1)),
                lt: new Date(Date.UTC(params.year, params.month, 1)),
            };
        } else if (params?.year) {
            where.date = {
                gte: new Date(Date.UTC(params.year, 0, 1)),
                lt: new Date(Date.UTC(params.year + 1, 0, 1)),
            };
        }

        if (params?.availableFrom) {
            where.availableFrom = { lte: new Date(params.availableFrom) };
        }

        return this.prisma.reservationSlot.findMany({ where, orderBy: { date: 'asc' } });
    }

    /**
     * Find the first available slot near a target date following the priority
     * order: 0, -1, +1, -2, +2 days from the target.
     * Uses a raw query to compare usedCapacity < totalCapacity (SQLite limitation).
     */
    async findAvailableReservationSlotNear(targetDate: Date): Promise<ReservationSlot | null> {
        const offsets = [0, -1, 1, -2, 2];
        const base = toMidnightUTC(targetDate);

        for (const offset of offsets) {
            const candidate = new Date(base);
            candidate.setUTCDate(candidate.getUTCDate() + offset);

            const rows = await this.prisma.$queryRaw<ReservationSlotRow[]>`
                SELECT id, date, "totalCapacity", "usedCapacity", "createdAt"
                FROM "Slot"
                WHERE date = ${candidate}
                    AND "usedCapacity" < "totalCapacity"
                LIMIT 1
            `;

            if (rows.length > 0) {
                return rows[0] as ReservationSlot;
            }
        }

        return null;
    }
}
