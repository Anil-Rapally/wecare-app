import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateBy } from 'class-validator';
import { BloodGroup, Gender } from '../entity/user.entity';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

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
      validate: (value: unknown): boolean => value === '' || Object.values(values).includes(value),
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

export class CreateUserDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Please enter your name' })
  @IsLengthWhenProvided(2, 100)
  fullName!: string;

  @IsDateWhenProvided()
  @IsNotEmpty({ message: 'Select date of birth' })
  dateOfBirth!: string;

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
  bloodGroup!: BloodGroup;

  @Transform(trim)
  @IsString()
  @MatchesWhenProvided(/^\+?[1-9]\d{7,14}$/, '')
  @IsNotEmpty({ message: 'Please enter emergency contact number' })
  emergencyContact!: string;

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
