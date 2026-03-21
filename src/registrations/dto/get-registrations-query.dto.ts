import { IsEmail, IsIn, IsOptional, IsString } from 'class-validator';

export class GetRegistrationsQueryDto {
    @IsOptional()
    @IsIn(['CREATED', 'DENIED'])
    status?: 'CREATED' | 'DENIED';

    @IsOptional()
    @IsString()
    plannedDate?: string;

    @IsOptional()
    @IsString()
    assignedDate?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    surname?: string;
}
