// src/odoo/odoo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/config/config.service';

interface OdooSystemParameter {
  id: number;
  key: string;
  value: string;
}

@Injectable()
export class OdooService {
  private readonly logger = new Logger(OdooService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getSystemParameters(): Promise<OdooSystemParameter[]> {
    const config = this.configService.getOdooConfig();
    const { url, api_key } = config;

    const apiUrl = `${url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'ir.config_parameter', // Ensure the model is specified
        method: 'search_read',
        args: [],
        kwargs: {
          fields: ['key', 'value'],
        },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      'X-API-Key': api_key, // Include the API key in the headers
    };

    console.log(headers);

    try {
      const response = await firstValueFrom(
        this.httpService.post(apiUrl, data, { headers }),
      );

      console.log('Odoo API Response:', response.data);

      if (!response.data || !response.data.result) {
        throw new Error('Invalid response from Odoo API');
      }

      return response.data.result as OdooSystemParameter[];
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to fetch system parameters: ${errorMessage}`);
      throw new Error(`Failed to fetch system parameters: ${errorMessage}`);
    }
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
