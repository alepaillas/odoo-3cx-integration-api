import { Controller, Post } from '@nestjs/common';
import { ThreeCxService } from './three-cx.service';

@Controller('three-cx')
export class ThreeCxController {
  constructor(private readonly threeCxService: ThreeCxService) {}

  @Post('connect/token')
  async connect(): Promise<string> {
    const token = await this.threeCxService.getToken();
    return token;
  }
}
