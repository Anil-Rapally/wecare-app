import { Controller, Get } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { ResponseMessage } from '../interceptors/response.interceptor';

@Controller('collections')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @Get()
  @ResponseMessage('Collections fetched successfully')
  getCollections() {
    return this.collectionService.findAll();
  }
}
