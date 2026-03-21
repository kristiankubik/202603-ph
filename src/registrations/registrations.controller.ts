import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { RegistrationsService } from './registrations.service.js';
import { CreateRegistrationDto } from './dto/create-registration.dto.js';
import { GetRegistrationsQueryDto } from './dto/get-registrations-query.dto.js';

@Controller('registrations')
export class RegistrationsController {
    constructor(private readonly registrationsService: RegistrationsService) {}

    /**
     * POST /registrations
     * Creates a patient registration and automatically attempts to assign a slot.
     * Returns both the registration and the resulting reservation (CREATED or DENIED).
     * Example:
     * POST /registrations
     * Body: { "name": "tehulka1", "surname": "tester", "phone": "123456789", "email": "tehulka1@tester.com", "plannedDate": "2026-05-28" }
     */
    @Post()
    create(@Body() dto: CreateRegistrationDto) {
        return this.registrationsService.create(dto);
    }

    /**
     * GET /registrations
     * GET /registrations?status=CREATED
     * GET /registrations?plannedDate=2026-05-26
     * GET /registrations?assignedDate=2026-05-28
     * GET /registrations?surname=Smith
     * GET /registrations?email=test@test.com&status=DENIED
     */
    @Get()
    findAll(@Query() query: GetRegistrationsQueryDto) {
        return this.registrationsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.registrationsService.findOne(id);
    }
}
