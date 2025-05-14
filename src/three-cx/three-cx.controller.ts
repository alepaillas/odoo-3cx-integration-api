// src/three-cx/three-cx.controller.ts
import { Controller, Post, Get, Query, Headers } from '@nestjs/common';
import { ThreeCxService } from './three-cx.service';
import { CallCostResponse } from './three-cx.interface';

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
    @Query('periodFrom') periodFrom?: string,
    @Query('periodTo') periodTo?: string,
  ): Promise<CallCostResponse> {
    // Extract the token from the Authorization header
    const accessToken = this.extractBearerToken(authorization);

    if (!accessToken) {
      throw new Error('Authorization token is required');
    }

    // console.log(accessToken);

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
