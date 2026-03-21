import { IsDate, IsInt, Max, Min, registerDecorator, ValidationOptions } from 'class-validator';
import { Type } from 'class-transformer';

export function IsFutureDate(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isFutureDate',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: Date) {
                    if (!(value instanceof Date)) {
                        return false;
                    }
                    return value.getTime() > Date.now();
                },
            },
        });
    };
}

export class CreateReservationSlotsDto {
    @Type(() => Date)
    @IsDate()
    @IsFutureDate({ message: 'date must be in the future' })
    date!: Date;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(12)
    slotsPerDay!: number;

    @Type(() => Date)
    @IsDate()
    // @IsFutureDate({ message: 'availableFrom must be in the future' })
    availableFrom!: Date;
}
