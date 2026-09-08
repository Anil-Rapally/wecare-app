import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return { service: 'WeCare API', status: 'ok' };
  }
}