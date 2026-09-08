import { Injectable } from '@nestjs/common';
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
        throw new Error('Collection not found');
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

  async findAll() {
    const reports = await this.reportRepository.find({
      relations: {
        collection: true,
      },
    });

    return reports.map(({ file_data, ...report }) => report);
  }
}
