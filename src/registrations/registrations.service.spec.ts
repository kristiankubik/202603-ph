import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationsService } from './registrations.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReservationSlotsService } from '../reservation-slots/reservation-slots.service.js';

describe('RegistrationsService', () => {
    let service: RegistrationsService;

    type PrismaMock = {
        registration: {
            create: ReturnType<typeof jest.fn>;
            findMany: ReturnType<typeof jest.fn>;
            findUnique: ReturnType<typeof jest.fn>;
        };
        reservation: {
            create: ReturnType<typeof jest.fn>;
        };
        reservationSlot: {
            update: ReturnType<typeof jest.fn>;
        };
        $queryRaw: ReturnType<typeof jest.fn>;
        $transaction: ReturnType<typeof jest.fn>;
    };
    type TxCallback = (tx: PrismaMock) => Promise<unknown>;

    const prismaMock: PrismaMock = {
        registration: {
            create: jest.fn<(args: unknown) => Promise<unknown>>(),
            findMany: jest.fn<(args: unknown) => Promise<unknown[]>>(),
            findUnique: jest.fn<(args: unknown) => Promise<unknown>>(),
        },
        reservation: {
            create: jest.fn<(args: unknown) => Promise<unknown>>(),
        },
        reservationSlot: {
            update: jest.fn<(args: unknown) => Promise<unknown>>(),
        },
        $queryRaw: jest.fn<(args: unknown) => Promise<unknown[]>>(),
        $transaction: jest.fn<(callback: TxCallback) => Promise<unknown>>(),
    };

    const reservationSlotsServiceMock = {};

    beforeEach(async () => {
        jest.clearAllMocks();

        prismaMock.$transaction.mockImplementation(async (callback: TxCallback) => {
            return callback(prismaMock);
        });

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RegistrationsService,
                {
                    provide: PrismaService,
                    useValue: prismaMock,
                },
                {
                    provide: ReservationSlotsService,
                    useValue: reservationSlotsServiceMock,
                },
            ],
        }).compile();

        service = module.get<RegistrationsService>(RegistrationsService);
    });

    describe('create', () => {
        it('creates registration and CREATED reservation when exact slot is available', async () => {
            prismaMock.registration.create.mockResolvedValue({
                id: 10,
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: new Date('2026-05-26T00:00:00.000Z'),
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            prismaMock.$queryRaw.mockResolvedValue([
                {
                    id: 20,
                    date: new Date('2026-05-26T00:00:00.000Z'),
                    totalCapacity: 2,
                    usedCapacity: 0,
                    availableFrom: new Date('2026-05-02T00:00:00.000Z'),
                    createdAt: new Date('2026-05-01T00:00:00.000Z'),
                },
            ]);

            prismaMock.reservationSlot.update.mockResolvedValue({
                id: 20,
                usedCapacity: 1,
            });

            prismaMock.reservation.create.mockResolvedValue({
                id: 30,
                registrationId: 10,
                reservationSlotId: 20,
                assignedDate: new Date('2026-05-26T00:00:00.000Z'),
                status: 'CREATED',
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            const result = await service.create({
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: '2026-05-26',
            });

            expect(prismaMock.registration.create).toHaveBeenCalled();
            expect(prismaMock.reservationSlot.update).toHaveBeenCalledWith({
                where: { id: 20 },
                data: { usedCapacity: { increment: 1 } },
            });
            expect(prismaMock.reservation.create).toHaveBeenCalledWith({
                data: {
                    registrationId: 10,
                    reservationSlotId: 20,
                    assignedDate: new Date('2026-05-26T00:00:00.000Z'),
                    status: 'CREATED',
                },
            });

            expect(result).toMatchObject({
                registration: { id: 10 },
                reservation: { status: 'CREATED' },
            });
        });

        it('falls back to next matching slot when exact day is unavailable', async () => {
            prismaMock.registration.create.mockResolvedValue({
                id: 10,
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: new Date('2026-05-26T00:00:00.000Z'),
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            prismaMock.$queryRaw
                .mockResolvedValueOnce([]) // 0
                .mockResolvedValueOnce([]) // -1
                .mockResolvedValueOnce([
                    {
                        id: 21,
                        date: new Date('2026-05-27T00:00:00.000Z'),
                        totalCapacity: 2,
                        usedCapacity: 0,
                        availableFrom: new Date('2026-05-02T00:00:00.000Z'),
                        createdAt: new Date('2026-05-01T00:00:00.000Z'),
                    },
                ]); // +1

            prismaMock.reservationSlot.update.mockResolvedValue({
                id: 21,
                usedCapacity: 1,
            });

            prismaMock.reservation.create.mockResolvedValue({
                id: 30,
                registrationId: 10,
                reservationSlotId: 21,
                assignedDate: new Date('2026-05-27T00:00:00.000Z'),
                status: 'CREATED',
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            const result = await service.create({
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: '2026-05-26',
            });

            expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(3);
            expect(result).toMatchObject({
                reservation: {
                    status: 'CREATED',
                    assignedDate: new Date('2026-05-27T00:00:00.000Z'),
                },
            });
        });

        it('creates DENIED reservation when no slot is available', async () => {
            prismaMock.registration.create.mockResolvedValue({
                id: 10,
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: new Date('2026-05-26T00:00:00.000Z'),
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            prismaMock.$queryRaw
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            prismaMock.reservation.create.mockResolvedValue({
                id: 31,
                registrationId: 10,
                reservationSlotId: null,
                assignedDate: null,
                status: 'DENIED',
                createdAt: new Date('2026-05-01T00:00:00.000Z'),
            });

            const result = await service.create({
                name: 'Jane',
                surname: 'Doe',
                phone: '123456',
                email: 'jane@example.com',
                plannedDate: '2026-05-26',
            });

            expect(prismaMock.reservationSlot.update).not.toHaveBeenCalled();
            expect(prismaMock.reservation.create).toHaveBeenCalledWith({
                data: {
                    registrationId: 10,
                    reservationSlotId: null,
                    assignedDate: null,
                    status: 'DENIED',
                },
            });
            expect(result).toMatchObject({
                reservation: { status: 'DENIED' },
            });
        });
    });

    describe('findAll', () => {
        it('returns registrations with reservation relation', async () => {
            prismaMock.registration.findMany.mockResolvedValue([]);

            await service.findAll();

            expect(prismaMock.registration.findMany).toHaveBeenCalledWith({
                where: {},
                include: {
                    reservation: {
                        include: {
                            reservationSlot: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        });
    });

    describe('findOne', () => {
        it('returns one registration with reservation and slot relation', async () => {
            prismaMock.registration.findUnique.mockResolvedValue(null);

            await service.findOne(10);

            expect(prismaMock.registration.findUnique).toHaveBeenCalledWith({
                where: { id: 10 },
                include: { reservation: { include: { reservationSlot: true } } },
            });
        });
    });
});
