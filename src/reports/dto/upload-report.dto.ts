import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UploadReportDto {
  
@IsDefined({
  message: i18nValidationMessage('validation.REPORT_NAME_REQUIRED'),
})
@IsNotEmpty({
  message: i18nValidationMessage('validation.REPORT_NAME_REQUIRED'),
})
@IsString({
  message: i18nValidationMessage('validation.REPORT_NAME_STRING'),
})
@MinLength(2, {
  message: i18nValidationMessage('validation.REPORT_NAME_MIN'),
})
@MaxLength(40, {
  message: i18nValidationMessage('validation.REPORT_NAME_MAX'),
})
@Matches(/[a-zA-Z]/, {
  message: i18nValidationMessage('validation.REPORT_NAME_TEXT'),
})
report_name!: string;
  
@IsDefined({
  message: i18nValidationMessage('validation.REPORT_TYPE_REQUIRED'),
})
@IsNotEmpty({
  message: i18nValidationMessage('validation.REPORT_TYPE_REQUIRED'),
})
@IsString({
  message: i18nValidationMessage('validation.REPORT_TYPE_STRING'),
})
@MinLength(2, {
  message: i18nValidationMessage('validation.REPORT_TYPE_MIN'),
})
@MaxLength(40, {
  message: i18nValidationMessage('validation.REPORT_TYPE_MAX'),
})
@Matches(/[a-zA-Z]/, {
  message: i18nValidationMessage('validation.REPORT_TYPE_TEXT'),
})
report_type!: string;

 
@IsNotEmpty({
  message: i18nValidationMessage('validation.REPORT_DATE_REQUIRED'),
})
  @IsDateString(
    {},
    {
      message: i18nValidationMessage('validation.REPORT_DATE_INVALID'),
    },
  )
report_date!: string;

  
@IsDefined({
  message: i18nValidationMessage('validation.HOSPITAL_REQUIRED'),
})
@IsNotEmpty({
  message: i18nValidationMessage('validation.HOSPITAL_REQUIRED'),
})
@IsString({
  message: i18nValidationMessage('validation.HOSPITAL_STRING'),
})
@MinLength(2, {
  message: i18nValidationMessage('validation.HOSPITAL_MIN'),
})
@MaxLength(100, {
  message: i18nValidationMessage('validation.HOSPITAL_MAX'),
})
@Matches(/[a-zA-Z]/, {
  message: i18nValidationMessage('validation.HOSPITAL_TEXT'),
})
hospital_or_diagnostic_center!: string;

  
@IsDefined({
  message: i18nValidationMessage('validation.DOCTOR_REQUIRED'),
})
@IsNotEmpty({
  message: i18nValidationMessage('validation.DOCTOR_REQUIRED'),
})
@IsString({
  message: i18nValidationMessage('validation.DOCTOR_STRING'),
})
@MinLength(2, {
  message: i18nValidationMessage('validation.DOCTOR_MIN'),
})
@MaxLength(60, {
  message: i18nValidationMessage('validation.DOCTOR_MAX'),
})
@Matches(/[a-zA-Z]/, {
  message: i18nValidationMessage('validation.DOCTOR_TEXT'),
})
doctor_name!: string;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage('validation.TAGS_STRING'),
  })
  @MinLength(2, {
    message: i18nValidationMessage('validation.TAGS_MIN'),
  })
  @MaxLength(255, {
    message: i18nValidationMessage('validation.TAGS_MAX'),
  })
  @Matches(/[a-zA-Z]/, {
    message: i18nValidationMessage('validation.TAGS_TEXT'),
  })
  tags?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  collection_id?: number;

  @IsOptional()
  @IsString({
    message: i18nValidationMessage(
      'validation.NEW_COLLECTION_NAME_STRING',
    ),
  })
  @MinLength(2, {
    message: i18nValidationMessage(
      'validation.NEW_COLLECTION_NAME_MIN',
    ),
  })
  @MaxLength(40, {
    message: i18nValidationMessage(
      'validation.NEW_COLLECTION_NAME_MAX',
    ),
  })
  @Matches(/[a-zA-Z]/, {
    message: i18nValidationMessage(
      'validation.NEW_COLLECTION_NAME_TEXT',
    ),
  })
  new_collection_name?: string;

}