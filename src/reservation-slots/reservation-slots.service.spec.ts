import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ReservationSlotsService } from './reservation-slots.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ReservationSlot } from '../prisma/generated/client.js';

describe('ReservationSlotsService', () => {
    let service: ReservationSlotsService;

    const prismaMock = {
        reservationSlot: {
            upsert: jest.fn<(args: unknown) => Promise<ReservationSlot>>(),
            findUnique: jest.fn<(args: unknown) => Promise<ReservationSlot | null>>(),
            findMany: jest.fn<(args: unknown) => Promise<ReservationSlot[]>>(),
        },
        $transaction: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ReservationSlotsService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
            ],
        }).compile();

        service = module.get<ReservationSlotsService>(ReservationSlotsService);
    });

    describe('create', () => {
        it('creates or upserts a reservation slot with normalized date', async () => {
            const inputDate = new Date('2026-05-26T15:42:00.000Z');
            const availableFrom = new Date('2026-05-02T12:00:00.000Z');

            prismaMock.reservationSlot.upsert.mockResolvedValue({
                id: 1,
                date: new Date('2026-05-26T00:00:00.000Z'),
                totalCapacity: 2,
                usedCapacity: 0,
                availableFrom,
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            const result = await service.create(inputDate, 2, availableFrom);

            expect(prismaMock.reservationSlot.upsert).toHaveBeenCalledTimes(1);
            expect(prismaMock.reservationSlot.upsert).toHaveBeenCalledWith({
                where: {
                    date: new Date('2026-05-26T00:00:00.000Z'),
                },
                create: {
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    totalCapacity: 2,
                    availableFrom,
                },
                update: {},
            });

            expect(result.totalCapacity).toBe(2);
        });
    });

    describe('createBulk', () => {
        it('creates multiple reservation slots', async () => {
            const items = [
                {
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    slotsPerDay: 2,
                    availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                },
                {
                    date: new Date('2026-05-27T00:00:00.000Z'),
                    slotsPerDay: 3,
                    availableFrom: new Date('2026-05-03T12:00:00.000Z'),
                },
            ];

            prismaMock.reservationSlot.upsert
                .mockResolvedValueOnce({
                    id: 1,
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    totalCapacity: 2,
                    usedCapacity: 0,
                    availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                    createdAt: new Date('2026-05-01T00:00:00.000Z'),
                })
                .mockResolvedValueOnce({
                    id: 2,
                    date: new Date('2026-05-27T00:00:00.000Z'),
                    totalCapacity: 3,
                    usedCapacity: 0,
                    availableFrom: new Date('2026-05-03T12:00:00.000Z'),
                    createdAt: new Date('2026-05-01T00:00:00.000Z'),
                });

            const result = await service.createBulk(items);

            expect(result).toHaveLength(2);
            expect(prismaMock.reservationSlot.upsert).toHaveBeenCalledTimes(2);
        });
    });

    describe('createOneOrMany', () => {
        it('routes single payload to create', async () => {
            const createSpy = jest.spyOn(service, 'create').mockResolvedValue({
                id: 1,
                date: new Date('2026-05-26T00:00:00.000Z'),
                totalCapacity: 2,
                usedCapacity: 0,
                availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            } as never);

            const result = await service.createOneOrMany({
                date: new Date('2026-05-26T00:00:00.000Z'),
                slotsPerDay: 2,
                availableFrom: new Date('2026-05-02T12:00:00.000Z'),
            });

            expect(createSpy).toHaveBeenCalledTimes(1);
            expect(Array.isArray(result)).toBe(false);
        });

        it('routes array payload to createBulk', async () => {
            const createBulkSpy = jest.spyOn(service, 'createBulk').mockResolvedValue([
                {
                    id: 1,
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    totalCapacity: 2,
                    usedCapacity: 0,
                    availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                    createdAt: new Date('2026-05-01T00:00:00.000Z'),
                },
            ] as never);

            const result = await service.createOneOrMany([
                {
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    slotsPerDay: 2,
                    availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                },
            ]);

            expect(createBulkSpy).toHaveBeenCalledTimes(1);
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('findByDate', () => {
        it('returns one-item array when slot exists', async () => {
            prismaMock.reservationSlot.findUnique.mockResolvedValue({
                id: 1,
                date: new Date('2026-05-26T00:00:00.000Z'),
                totalCapacity: 2,
                usedCapacity: 0,
                availableFrom: new Date('2026-05-02T12:00:00.000Z'),
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            const result = await service.findByDate(
                '2026-05-26',
                new Date('2026-05-03T00:00:00.000Z'),
            );

            expect(prismaMock.reservationSlot.findUnique).toHaveBeenCalledWith({
                where: {
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    availableFrom: {
                        lte: new Date('2026-05-03T00:00:00.000Z'),
                    },
                },
            });
            expect(result).toHaveLength(1);
        });

        it('returns empty array when slot does not exist', async () => {
            prismaMock.reservationSlot.findUnique.mockResolvedValue(null);

            const result = await service.findByDate(
                '2026-05-26',
                new Date('2026-05-03T00:00:00.000Z'),
            );

            expect(result).toEqual([]);
        });

        it('throws on invalid date', async () => {
            await expect(
                service.findByDate('not-a-date', new Date('2026-05-03T00:00:00.000Z')),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findAll', () => {
        it('returns all reservation slots when no filter is provided', async () => {
            prismaMock.reservationSlot.findMany.mockResolvedValue([]);

            await service.findAll({});

            expect(prismaMock.reservationSlot.findMany).toHaveBeenCalledWith({
                where: {},
                orderBy: { date: 'asc' },
            });
        });

        it('filters by year and month', async () => {
            prismaMock.reservationSlot.findMany.mockResolvedValue([]);

            await service.findAll({ year: 2026, month: 5 });

            expect(prismaMock.reservationSlot.findMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: new Date(Date.UTC(2026, 4, 1)),
                        lt: new Date(Date.UTC(2026, 5, 1)),
                    },
                },
                orderBy: { date: 'asc' },
            });
        });

        it('filters by year only', async () => {
            prismaMock.reservationSlot.findMany.mockResolvedValue([]);

            await service.findAll({ year: 2026 });

            expect(prismaMock.reservationSlot.findMany).toHaveBeenCalledWith({
                where: {
                    date: {
                        gte: new Date(Date.UTC(2026, 0, 1)),
                        lt: new Date(Date.UTC(2027, 0, 1)),
                    },
                },
                orderBy: { date: 'asc' },
            });
        });
    });
});
