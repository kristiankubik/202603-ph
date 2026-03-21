import { Module } from '@nestjs/common';
import { ReservationSlotsController } from './reservation-slots.controller.js';
import { ReservationSlotsService } from './reservation-slots.service.js';

@Module({
    imports: [],
    controllers: [ReservationSlotsController],
    providers: [ReservationSlotsService],
    exports: [ReservationSlotsService],
})
export class ReservationSlotsModule {}
