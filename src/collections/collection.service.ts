import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Collection } from './entity/collection.entity';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
  ) {}

  findAll() {
    return this.collectionRepository.find();
  }

  async createDefaultCollection() {
    const existingCollection = await this.collectionRepository.findOne({
      where: { name: 'MY REPORTS' },
    });

    if (!existingCollection) {
      await this.collectionRepository.save({
        name: 'MY REPORTS',
      });
    }
  }
}
