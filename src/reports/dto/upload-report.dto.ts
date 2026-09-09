import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadReportDto {
  @IsNotEmpty({
    message: 'report_name should not be empty',
  })
  @IsString({
    message: 'report_name must be a string',
  })
  @Matches(/[a-zA-Z]/, {
    message: 'report_name must contain text',
  })
  report_name!: string;

  @IsNotEmpty({
    message: 'report_type should not be empty',
  })
  @IsString({
    message: 'report_type must be a string',
  })
  report_type!: string;

  @IsNotEmpty({
    message: 'report_date should not be empty',
  })
  @IsDateString(
    {},
    {
      message: 'report_date must be a valid date',
    },
  )
  report_date!: string;

  @IsNotEmpty({
    message: 'hospital_or_diagnostic_center should not be empty',
  })
  @IsString({
    message: 'hospital_or_diagnostic_center must be a string',
  })
  @Matches(/[a-zA-Z]/, {
    message: 'hospital_or_diagnostic_center must contain text',
  })
  hospital_or_diagnostic_center!: string;

  @IsNotEmpty({
    message: 'doctor_name should not be empty',
  })
  @IsString({
    message: 'doctor_name must be a string',
  })
  @Matches(/[a-zA-Z]/, {
    message: 'doctor_name must contain text',
  })
  doctor_name!: string;

  @IsOptional()
  @IsString({
    message: 'tags must be a string',
  })
  tags?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  collection_id?: number;

  @IsOptional()
  @IsString()
  new_collection_name?: string;
}