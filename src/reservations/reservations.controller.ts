import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ReservationsService } from './reservations.service.js';

@Controller('reservations')
export class ReservationsController {
    constructor(private readonly reservationsService: ReservationsService) {}

    @Get()
    findAll() {
        return this.reservationsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.reservationsService.findOne(id);
    }
}
