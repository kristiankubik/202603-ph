import { APP_GUARD } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { CorrelationIdMiddleware } from './middlewares/correlation-id.middleware.js';
import { AuditLogMiddleware } from './middlewares/audit-log.middleware.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { MaintenanceGuard } from './guards/maintenance.guard.js';
import { RegistrationsModule } from './registrations/registrations.module.js';
import { ReservationSlotsModule } from './reservation-slots/reservation-slots.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
@Module({
    imports: [PrismaModule, ReservationSlotsModule, ReservationsModule, RegistrationsModule],
    providers: [
        {
            provide: APP_GUARD,
            useClass: MaintenanceGuard,
        },
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
        AppService,
    ],
    controllers: [AppController],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        // we gfenerate correlation-id in case we need to track the issue across
        consumer.apply(CorrelationIdMiddleware).forRoutes('*');
        consumer.apply(AuditLogMiddleware).forRoutes('*');
    }
}
