import { Controller, Get } from '@nestjs/common';
import { CollectionService } from './collection.service';

@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @Get()
  getCollections() {
    return this.collectionService.findAll();
  }
}
