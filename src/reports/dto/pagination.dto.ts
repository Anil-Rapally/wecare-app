import { Transform } from 'class-transformer';

import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

import { i18nValidationMessage } from 'nestjs-i18n';

export class PaginationDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }

    return Number(value);
  })
  @IsInt({
    message: i18nValidationMessage('validation.PAGE_INTEGER'),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.PAGE_MIN'),
  })
  page = 1;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string' && !/^-?\d+(\.\d+)?$/.test(value)) {
      return value;
    }

    return Number(value);
  })
  @IsInt({
    message: i18nValidationMessage('validation.LIMIT_INTEGER'),
  })
  @Min(1, {
    message: i18nValidationMessage('validation.LIMIT_MIN'),
  })
  @Max(100, {
    message: i18nValidationMessage('validation.LIMIT_MAX'),
  })
  limit = 10;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.SEARCH_STRING'),
  })
  @Matches(/[a-zA-Z]/, {
    message: i18nValidationMessage('validation.SEARCH_TEXT'),
  })
  search?: string;
}