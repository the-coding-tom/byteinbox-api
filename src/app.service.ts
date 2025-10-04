import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  constructor() {}
  
  async getServicesStatuses(): Promise<any> {
    return {
      status: 200,
      message: 'Hello World!!',
    };
  }
}
