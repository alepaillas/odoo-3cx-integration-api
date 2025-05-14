// src/three-cx/three-cx.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';
import { CallCostResponse, TokenResponse } from './three-cx.interface';

@Injectable()
export class ThreeCxService {
  private readonly logger = new Logger(ThreeCxService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getToken(): Promise<string> {
    const config = this.configService.getThreeCxConfig();
    const apiUrl = `${config.url}/connect/token`;

    const data = new URLSearchParams();
    data.append('client_id', config.client_id);
    data.append('client_secret', config.client_secret);
    data.append('grant_type', config.grant_type);

    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, data, { headers }),
      );

      const tokenData = response.data as TokenResponse;

      if (
        typeof tokenData.access_token !== 'string' ||
        !tokenData.access_token
      ) {
        throw new Error(
          'Invalid token response: missing or invalid access_token',
        );
      }

      return tokenData.access_token;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to obtain token: ${errorMessage}`);
      throw new Error(`Failed to obtain token: ${errorMessage}`);
    }
  }

  async getReportCallCostByExtensionGroup(
    accessToken: string,
    periodFrom?: string,
    periodTo?: string,
  ): Promise<CallCostResponse> {
    const config = this.configService.getThreeCxConfig();
    const url = config.url;

    // Required fields from config
    const groupFilter = config.group_filter;
    const callClass = config.call_class;

    // Use provided dates or fall back to fixed date/default values
    const fromDate = periodFrom || this.getFixedFromDate();
    const encodedFromDate = encodeURIComponent(fromDate.toString());
    const toDate = periodTo || new Date().toISOString();
    const encodedToDate = encodeURIComponent(toDate.toString());

    // Construct the API URL properly
    const apiUrl = `${url}/xapi/v1/ReportCallCostByExtensionGroup/Pbx.GetCallCostByExtensionGroupData(periodFrom=${encodedFromDate},periodTo=${encodedToDate},groupFilter='${groupFilter}',callClass=${callClass})`;
    // console.log(apiUrl);

    const headers = {
      Authorization: `Bearer ${accessToken}`,
    };

    // console.log(headers);

    try {
      const response = await firstValueFrom(
        this.httpService.get(apiUrl, { headers }),
      );

      // Validate the response structure
      const responseData = response.data as unknown;

      if (
        !responseData ||
        typeof responseData !== 'object' ||
        !('value' in responseData) ||
        !Array.isArray(responseData.value)
      ) {
        throw new Error('Invalid response from API: missing required fields');
      }

      // Type assertion after validation
      return responseData as CallCostResponse;
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to fetch call cost data: ${errorMessage}`);
      throw new Error(`Failed to fetch call cost data: ${errorMessage}`);
    }
  }

  private getFixedFromDate(): string {
    // For now, return a fixed date
    return '2025-01-01T00:00:00.000Z';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }
}
