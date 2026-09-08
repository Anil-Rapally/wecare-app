import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Report } from './entity/report.entity';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

import { Collection } from '../collections/entity/collection.entity';
import { CollectionModule } from '../collections/collection.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Collection]), CollectionModule],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
