import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ReservationsService {
    constructor(private readonly prisma: PrismaService) {}

    findAll() {
        return this.prisma.reservation.findMany({
            include: {
                registration: true,
                reservationSlot: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: number) {
        return this.prisma.reservation.findUnique({
            where: { id },
            include: { registration: true, reservationSlot: true },
        });
    }
}
