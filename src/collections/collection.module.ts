import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from './entity/collection.entity';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Collection])],
  controllers: [CollectionController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule implements OnModuleInit {
  constructor(private collectionService: CollectionService) {}

  async onModuleInit() {
    await this.collectionService.createDefaultCollection();
  }
}
