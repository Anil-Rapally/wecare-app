import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import type { TransformFnParams } from 'class-transformer';
import { IsNotEmpty, MaxLength, ValidateBy, isEmail } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

const IsEmailWhenProvided = (validationOptions?: ValidationOptions) =>
  ValidateBy(
    {
      name: 'isEmailWhenProvided',
      validator: {
        validate: (value: unknown): boolean =>
          value === undefined || value === '' || (typeof value === 'string' && isEmail(value)),
        defaultMessage: () => 'Please enter a valid email address',
      },
    },
    validationOptions,
  );

export class LoginDto {
  // This app treats emails case-insensitively; '+' and dots are preserved
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim().toLowerCase() : (value ?? undefined),
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
