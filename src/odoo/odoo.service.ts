// src/odoo/odoo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/config/config.service';
import {
  OdooLoginResponse,
  OdooResponse,
  OdooSystemParameter,
} from './odoo.interface';

@Injectable()
export class OdooService {
  private readonly logger = new Logger(OdooService.name);
  private sessionCookie: string | null = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async authenticate(): Promise<void> {
    const config = this.configService.getOdooConfig();
    const { url, username, password, db } = config;

    const loginUrl = `${url}/web/session/authenticate`;

    const loginData = {
      jsonrpc: '2.0',
      params: {
        db,
        login: username,
        password,
      },
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<OdooResponse<OdooLoginResponse>>(
          loginUrl,
          loginData,
          {
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );

      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        this.sessionCookie = cookies[0].split(';')[0];
      } else {
        throw new Error('No session cookie received');
      }
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Authentication failed: ${errorMessage}`);
      throw new Error(`Authentication failed: ${errorMessage}`);
    }
  }

  async getSystemParameters(): Promise<OdooSystemParameter[]> {
    const config = this.configService.getOdooConfig();
    const { url } = config;

    // Authenticate if we don't have a session
    if (!this.sessionCookie) {
      await this.authenticate();
    }

    const apiUrl = `${url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'ir.config_parameter',
        method: 'search_read',
        args: [],
        kwargs: {
          fields: ['key', 'value'],
        },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<OdooResponse<OdooSystemParameter[]>>(
          apiUrl,
          data,
          { headers },
        ),
      );

      if (!response.data?.result) {
        throw new Error('Invalid response from Odoo API');
      }

      return response.data.result;
    } catch (error) {
      // If we get a session expired error, try to reauthenticate once
      if (this.isSessionExpiredError(error)) {
        this.logger.log('Session expired, attempting to reauthenticate');
        await this.authenticate();

        // Retry the request with new session
        const retryResponse = await firstValueFrom(
          this.httpService.post<OdooResponse<OdooSystemParameter[]>>(
            apiUrl,
            data,
            {
              headers: {
                'Content-Type': 'application/json',
                Cookie: this.sessionCookie as string,
              },
            },
          ),
        );

        if (!retryResponse.data?.result) {
          throw new Error(
            'Invalid response from Odoo API after reauthentication',
          );
        }

        return retryResponse.data.result;
      }

      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to fetch system parameters: ${errorMessage}`);
      throw new Error(`Failed to fetch system parameters: ${errorMessage}`);
    }
  }

  async setSystemParameter(
    key: string,
    value: string,
  ): Promise<OdooSystemParameter> {
    const config = this.configService.getOdooConfig();
    const { url } = config;

    // Authenticate if we don't have a session
    if (!this.sessionCookie) {
      await this.authenticate();
    }

    const apiUrl = `${url}/web/dataset/call_kw`;

    // First, try to find if the parameter already exists
    const searchData = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'ir.config_parameter',
        method: 'search',
        args: [[['key', '=', key]]],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    try {
      // Search for existing parameter
      const searchResponse = await firstValueFrom(
        this.httpService.post<OdooResponse<number[]>>(apiUrl, searchData, {
          headers,
        }),
      );

      const paramId = searchResponse.data?.result?.[0] || false;

      // Prepare the data for write operation
      const writeData = {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          model: 'ir.config_parameter',
          method: paramId ? 'write' : 'create',
          args: paramId ? [[paramId], { value }] : [{ key, value }],
          kwargs: {},
        },
      };

      // Execute the write operation
      const writeResponse = await firstValueFrom(
        this.httpService.post<OdooResponse<boolean | number>>(
          apiUrl,
          writeData,
          { headers },
        ),
      );

      if (writeResponse.data?.result === false) {
        throw new Error('Failed to write system parameter');
      }

      // Return the updated parameter
      const resultId =
        paramId ||
        (typeof writeResponse.data.result === 'number'
          ? writeResponse.data.result
          : false);

      if (!resultId) {
        throw new Error('Failed to get parameter ID after creation/update');
      }

      return {
        id: resultId,
        key,
        value,
      };
    } catch (error) {
      // If we get a session expired error, try to reauthenticate once
      if (this.isSessionExpiredError(error)) {
        this.logger.log('Session expired, attempting to reauthenticate');
        await this.authenticate();

        // Retry the operation with new session
        return this.setSystemParameter(key, value);
      }

      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to set system parameter: ${errorMessage}`);
      throw new Error(`Failed to set system parameter: ${errorMessage}`);
    }
  }

  private isSessionExpiredError(error: unknown): boolean {
    if (error instanceof Error) {
      return error.message.includes('Session Expired');
    }
    return false;
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
