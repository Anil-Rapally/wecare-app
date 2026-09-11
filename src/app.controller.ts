import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

import { ResponseMessage } from './interceptors/response.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('Welcome message fetched successfully')
  getHello(): string {
    return this.appService.getHello();
  }
}