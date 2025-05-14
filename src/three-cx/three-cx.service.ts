// src/three-cx/three-cx.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '../config/config.service';

interface TokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string | null;
}

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to obtain token: ${errorMessage}`);
      throw new Error(`Failed to obtain token: ${errorMessage}`);
    }
  }
}
