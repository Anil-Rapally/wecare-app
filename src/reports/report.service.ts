import { Injectable,NotFoundException,BadRequestException  } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Report } from './entity/report.entity';
import { Collection } from '../collections/entity/collection.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,

    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
  ) {}

  async saveReport(
    reportData: Partial<Report>,
    collectionId?: number,
    newCollectionName?: string,
  ) {
    let selectedCollection: Collection;

    if (newCollectionName) {
      let collection = await this.collectionRepository.findOne({
        where: { name: newCollectionName },
      });

      if (!collection) {
        collection = await this.collectionRepository.save({
          name: newCollectionName,
        });
      }

      selectedCollection = collection;
    } else {
      const collection = await this.collectionRepository.findOne({
        where: { id: collectionId },
      });

      if (!collection) {
        throw new NotFoundException('Collection not found');
      }
      selectedCollection = collection;
    }

    const report = this.reportRepository.create({
      ...reportData,
      collection_id: selectedCollection.id,
      collection: selectedCollection,
    });

    const savedReport = await this.reportRepository.save(report);

    const { file_data, ...reportResponse } = savedReport;

    return reportResponse;
  }

  async findAll(page: number, limit: number, search?: string) {
    const query = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.collection', 'collection')
    .orderBy('report.created_at', 'DESC');

  if (search) {
    query.where(
      'report.report_name LIKE :search OR report.report_type LIKE :search OR report.tags LIKE :search',
      { search: `%${search}%` },
    );

    const reports = await query.getMany();

    return {
      data: reports.map(({ file_data, ...report }) => report),
    };
  }

  const [reports, total] = await query
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  const totalPages = Math.ceil(total / limit);

  if (total > 0 && page > totalPages) {
    throw new BadRequestException(
      `Page ${page} does not exist. Total pages: ${totalPages}`,
    );
  }

  return {
    data: reports.map(({ file_data, ...report }) => report),
    total,
    page,
    limit,
    totalPages,
  };
}
}
