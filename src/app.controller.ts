import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('integrate-three-cx-data')
  async integrateThreeCxData(): Promise<string> {
    const data = await this.appService.integrateThreeCxData();
    return data;
  }
}
