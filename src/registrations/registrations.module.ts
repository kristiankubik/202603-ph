import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller.js';
import { RegistrationsService } from './registrations.service.js';
import { ReservationSlotsModule } from '../reservation-slots/reservation-slots.module.js';

@Module({
    imports: [ReservationSlotsModule],
    controllers: [RegistrationsController],
    providers: [RegistrationsService],
})
export class RegistrationsModule {}
