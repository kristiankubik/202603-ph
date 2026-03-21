import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    ParseArrayPipe,
    BadRequestException,
} from '@nestjs/common';
import { CreateReservationSlotsDto } from './dto/create-reservation-slots.dto.js';
import { GetReservationSlotsQueryDto } from './dto/get-reservation-slots-query.dto.js';
import { ReservationSlotsService } from './reservation-slots.service.js';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Public } from '../decorators/public-route.decorator.js';

@Controller('reservation-slots')
export class ReservationSlotsController {
    constructor(private readonly reservationSlotsService: ReservationSlotsService) {}

    /**
     * Combined endpoint. Creates reservation-slots for specific day OR creates slots bulk
     * Example:
     * POST /reservation-slots
     * Body: { "date": "2026-05-24", "slotsPerDay": 4 }
     * OR
     * Body: [{ "date": "2026-05-24", "slotsPerDay": 4 }, { "date": "2026-05-25", "slotsPerDay": 2 }]
     */
    @Post()
    create(@Body() body: unknown) {
        if (Array.isArray(body)) {
            const items = plainToInstance(CreateReservationSlotsDto, body);

            for (const item of items) {
                const errors = validateSync(item);
                if (errors.length > 0) {
                    throw new BadRequestException(errors);
                }
            }

            return this.reservationSlotsService.createBulk(items);
        }

        const dto = plainToInstance(CreateReservationSlotsDto, body);
        const errors = validateSync(dto);

        if (errors.length > 0) {
            throw new BadRequestException(errors);
        }

        return this.reservationSlotsService.create(dto.date, dto.slotsPerDay, dto.availableFrom);
    }

    /**
     * Creates reservation-slots for multiple specific days
     * Example:
     * POST /reservation-slots/bulk
     * Body:
     * [
     *     { "date": "2026-05-24", "slotsPerDay": 4 },
     *     { "date": "2026-05-25", "slotsPerDay": 6 }
     * ]
     */
    @Post('bulk')
    createBulk(
        @Body(new ParseArrayPipe({ items: CreateReservationSlotsDto }))
        items: CreateReservationSlotsDto[],
    ) {
        return this.reservationSlotsService.createBulk(items);
    }

    /**
     * Returns all reservation-slot records for the given month (or all if no filter).
     * Dont allow listing any more.
     * Example:
     * GET /reservation-slots?year=2026&month=4
     * GET /reservation-slots?year=2026&month=4&day=22
     * GET /reservation-slots?date=2026-04-22
     */
    @Public()
    @Get()
    findAll(@Query() query: GetReservationSlotsQueryDto) {
        const { year, month, day, date } = query;

        if (date && (year !== undefined || month !== undefined || day !== undefined)) {
            throw new BadRequestException('Use either date or year/month[/day], not both');
        }

        if (day !== undefined && (year === undefined || month === undefined)) {
            throw new BadRequestException('day requires both year and month');
        }

        if (month !== undefined && year === undefined) {
            throw new BadRequestException('month requires year');
        }

        if (date) {
            return this.reservationSlotsService.findByDate(date, new Date());
        }

        if (day !== undefined) {
            const specificDate = new Date(Date.UTC(year, month - 1, day));
            return this.reservationSlotsService.findByDate(specificDate.toISOString(), new Date());
        }

        return this.reservationSlotsService.findAll({
            year: year,
            month: month,
            availableFrom: new Date(),
        });
    }
}
