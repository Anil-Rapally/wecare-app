import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import {
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    isEmail,
    MaxLength,
    Matches,
    ValidateBy,
} from 'class-validator';
import type { ValidationOptions } from 'class-validator';
import { BloodGroup, Gender } from '../entity/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const trim = ({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value;

const IsEmailWhenProvided = (validationOptions?: ValidationOptions) =>
    ValidateBy(
        {
            name: 'isEmailWhenProvided',
            validator: {
                validate: (value: unknown): boolean =>
                    value === undefined ||
                    value === '' ||
                    (typeof value === 'string' && isEmail(value)),
                defaultMessage: () => 'Please enter a valid email address',
            },
        },
        validationOptions,
    );

const IsLengthWhenProvided = (min: number, max: number) =>
    ValidateBy({
        name: 'isLengthWhenProvided',
        validator: {
            validate: (value: unknown): boolean =>
                value === '' || (typeof value === 'string' && value.length >= min && value.length <= max),
            defaultMessage: (_args) => ' ',
        },
    });

const IsDateWhenProvided = () =>
    ValidateBy({
        name: 'isDateWhenProvided',
        validator: {
            validate: (value: unknown): boolean =>
                value === '' ||
                (typeof value === 'string' &&
                    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                    !Number.isNaN(Date.parse(value))),
            defaultMessage: () => '',
        },
    });

const IsEnumWhenProvided = (values: object) =>
    ValidateBy({
        name: 'isEnumWhenProvided',
        validator: {
            validate: (value: unknown): boolean =>
                value === '' || Object.values(values).includes(value),
            defaultMessage: () => 'The value must be a valid enum member',
        },
    });

const MatchesWhenProvided = (pattern: RegExp, message: string) =>
    ValidateBy({
        name: 'matchesWhenProvided',
        validator: {
            validate: (value: unknown): boolean =>
                value === '' || (typeof value === 'string' && pattern.test(value)),
            defaultMessage: () => message,
        },
    });


export class LoginDto {
    // This app treats emails case-insensitively; '+' and dots are preserved.
    @Transform(({ value }: TransformFnParams): unknown =>
        typeof value === 'string'
            ? value.trim().toLowerCase()
            : value ?? undefined,
    )

    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
    })
    @IsEmailWhenProvided()
    @IsNotEmpty({ message: 'Please enter your email address' })
    @MaxLength(250)
    email!: string;
}

export class VerifyOtpDto extends LoginDto {
    @IsUUID('4')
    otpid!: string;

    @IsString()
    @Matches(/^\d{4}$/)
    otp!: string;
}

export class CreateUserDto {
    @Transform(trim)
    @IsString()
    @IsNotEmpty({ message: 'Please enter your name' })
    @IsLengthWhenProvided(2, 100)
    full_name!: string;

    @IsDateWhenProvided()
    @IsNotEmpty({ message: 'Select date of birth' })
    date_of_birth!: string;

    @ApiProperty({
        enum: Gender,
        example: Gender.MALE,
    })
    @IsEnumWhenProvided(Gender)
    @IsNotEmpty({ message: 'Select your gender' })
    gender!: Gender;

    @ApiProperty({
        enum: BloodGroup,
        example: BloodGroup.O_POSITIVE,
    })
    @IsEnumWhenProvided(BloodGroup)
    @IsNotEmpty({ message: 'Select blood group' })
    blood_group!: BloodGroup;

    @Transform(trim)
    @IsString()
    @MatchesWhenProvided(/^\+?[1-9]\d{7,14}$/, '')
    @IsNotEmpty({ message: 'Please enter emergency contact number' })
    emergency_contact!: string;

    @IsOptional()
    @Transform(trim)
    @IsString()
    @MaxLength(500)
    @ApiPropertyOptional({
        example: 'Hyderabad',
        description: 'User address',
    })
    address?: string | null;
}