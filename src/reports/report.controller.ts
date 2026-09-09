import {
  Body,
  Controller,
  Get,
  Query,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadReportDto } from './dto/upload-report.dto';

import { ReportService } from './report.service';
import { PaginationDto } from './dto/pagination.dto';

@Controller('reports')
export class ReportController {
  constructor(private reportService: ReportService) {}

 @Get()
  getReports(@Query() pagination: PaginationDto) {
  return this.reportService.findAll(
    pagination.page,
    pagination.limit,
    pagination.search,
  );
}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 25 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (allowedTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(
            new Error('Only PDF, JPG, JPEG and PNG files are allowed'),
            false,
          );
        }
      },
    }),
  )
  uploadReport(@UploadedFile() file: any, @Body() body: UploadReportDto) {
    return this.reportService.saveReport(
      {
        report_name: body.report_name,
        report_type: body.report_type,
        report_date: new Date(body.report_date),
        hospital_or_diagnostic_center: body.hospital_or_diagnostic_center,
        doctor_name: body.doctor_name,
        tags: body.tags,
        file_name: file.originalname,
        file_type: file.mimetype,
        file_size: file.size,
        file_data: file.buffer,
      },
      body.collection_id,
      body.new_collection_name,
    );
  }
}
