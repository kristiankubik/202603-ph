import { IsDateString, IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateRegistrationDto {
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    surname!: string;

    @IsString()
    @IsNotEmpty()
    phone!: string;

    @IsEmail()
    email!: string;

    /** ISO 8601 date string, e.g. "2026-04-15" */
    @IsDateString()
    plannedDate!: string;
}
