import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetReservationSlotsQueryDto {
    @Type(() => Number)
    @IsInt()
    @Min(1900)
    @Max(2100)
    year!: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    month!: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(31)
    day?: number;

    @IsOptional()
    @IsString()
    date?: string;
}
