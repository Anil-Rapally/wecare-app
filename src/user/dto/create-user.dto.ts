import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength, ValidateBy } from 'class-validator';
import { BloodGroup, Gender } from '../entity/user.entity';
import { i18nValidationMessage } from 'nestjs-i18n';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const IsLengthWhenProvided = (min: number, max: number) =>
  ValidateBy({
    name: 'isLengthWhenProvided',
    validator: {
      validate: (value: unknown): boolean =>
        value === '' || (typeof value === 'string' && value.length >= min && value.length <= max),
      defaultMessage: (_args) => '',
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

const IsEnumWhenProvided = (values: object, message: string) =>
  ValidateBy({
    name: 'isEnumWhenProvided',
    validator: {
      validate: (value: unknown): boolean => value === '' || Object.values(values).includes(value),
      defaultMessage: () => message,
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
  @IsNotEmpty({ message: i18nValidationMessage('validation.ENTER_NAME') })
  @IsLengthWhenProvided(2, 100)
  fullName!: string;

  @Transform(trim)
  @IsDateWhenProvided()
  @IsNotEmpty({ message: i18nValidationMessage('validation.SELECT_DOB') })
  dateOfBirth!: string;

  @ApiProperty({
    enum: Gender,
    example: Gender.MALE,
  })
  @Transform(trim)
  @IsEnumWhenProvided(Gender, '')
  @IsNotEmpty({ message: i18nValidationMessage('validation.SELECT_GENDER') })
  gender!: Gender;

  @ApiProperty({
    enum: BloodGroup,
    example: BloodGroup.O_POSITIVE,
  })
  @Transform(trim)
  @IsEnumWhenProvided(BloodGroup, '')
  @IsNotEmpty({ message: i18nValidationMessage('validation.SELECT_BLOOD_GROUP') })
  bloodGroup!: BloodGroup;

  @Transform(trim)
  @IsString()
  @MatchesWhenProvided(/^\+?[1-9]\d{7,14}$/, '')
  @IsNotEmpty({ message: i18nValidationMessage('validation.ENTER_EMERGENCY_CONTACT') })
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
