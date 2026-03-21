import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationsService } from './reservations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

type PrismaMock = {
    reservation: {
        findMany: ReturnType<typeof jest.fn>;
        findUnique: ReturnType<typeof jest.fn>;
    };
};

describe('ReservationsService', () => {
    let service: ReservationsService;

    const prismaMock: PrismaMock = {
        reservation: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReservationsService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        service = module.get<ReservationsService>(ReservationsService);
    });

    describe('findAll', () => {
        it('returns all reservations with registration and reservationSlot relation', async () => {
            prismaMock.reservation.findMany.mockResolvedValue([]);

            await service.findAll();

            expect(prismaMock.reservation.findMany).toHaveBeenCalledWith({
                include: {
                    registration: true,
                    reservationSlot: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
        });
    });

    describe('findOne', () => {
        it('returns one reservation by id with registration and reservationSlot relation', async () => {
            prismaMock.reservation.findUnique.mockResolvedValue(null);

            await service.findOne(10);

            expect(prismaMock.reservation.findUnique).toHaveBeenCalledWith({
                where: { id: 10 },
                include: {
                    registration: true,
                    reservationSlot: true,
                },
            });
        });
    });
});
