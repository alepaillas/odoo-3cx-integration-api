// src/three-cx/three-cx.controller.ts
import {
  Controller,
  Post,
  Get,
  Query,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { ThreeCxService } from './three-cx.service';
import { CallCostResponse } from './three-cx.interface';
import { GetReportCallCostByExtensionGroupDto } from './dto/three-cx.dto';

@Controller('three-cx')
export class ThreeCxController {
  constructor(private readonly threeCxService: ThreeCxService) {}

  @Post('connect/token')
  async connect(): Promise<string> {
    const token = await this.threeCxService.getToken();
    return token;
  }

  @Get('ReportCallCostByExtensionGroup')
  async getReportCallCostByExtensionGroup(
    @Headers('authorization') authorization: string,
    @Query() parameterDto: GetReportCallCostByExtensionGroupDto,
  ): Promise<CallCostResponse> {
    const accessToken = this.extractBearerToken(authorization);
    if (!accessToken) {
      throw new Error('Authorization token is required');
    }

    const { periodFrom, periodTo } = parameterDto;
    if (!parameterDto || !periodFrom) {
      throw new BadRequestException('periodFrom is required');
    }

    return this.threeCxService.getReportCallCostByExtensionGroup(
      accessToken,
      periodFrom,
      periodTo,
    );
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader) {
      return null;
    }

    const parts = authorizationHeader.split(' ');

    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return null;
    }

    return parts[1];
  }
}
