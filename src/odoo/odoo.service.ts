// src/odoo/odoo.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from 'src/config/config.service';
import {
  OdooError,
  OdooLoginResponse,
  OdooResponse,
  OdooSystemParameter,
} from './odoo.interface';
import { CreateLeadDto } from './dto/odoo.dto';

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

  async createLead(leadData: CreateLeadDto): Promise<number> {
    const config = this.configService.getOdooConfig();
    const { url } = config;

    // Authenticate if we don't have a session
    if (!this.sessionCookie) {
      await this.authenticate();
    }

    const apiUrl = `${url}/web/dataset/call_kw`;

    // Ensure this is created as a lead, not an opportunity
    const leadPayload = {
      ...leadData,
      type: 'lead', // Explicitly set as lead
    };

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'crm.lead',
        method: 'create',
        args: [leadPayload],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<OdooResponse<number>>(apiUrl, data, {
          headers,
        }),
      );

      // Check for Odoo errors in the response
      if (response.data.error) {
        const error = response.data.error;
        const errorDetails = this.formatOdooError(error);
        this.logger.error(`Odoo API Error: ${errorDetails}`);
        throw new Error(errorDetails);
      }

      if (!response.data.result) {
        throw new Error('No result received from Odoo API');
      }

      return response.data.result;
    } catch (error) {
      // If we get a session expired error, try to reauthenticate once
      if (this.isSessionExpiredError(error)) {
        this.logger.log('Session expired, attempting to reauthenticate');
        await this.authenticate();

        // Retry the request with new session
        return this.createLead(leadData);
      }

      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to create lead: ${errorMessage}`);
      throw new Error(`Failed to create lead: ${errorMessage}`);
    }
  }

  async findUserByName(name: string): Promise<number | null> {
    const config = this.configService.getOdooConfig();
    const { url } = config;

    if (!this.sessionCookie) {
      await this.authenticate();
    }

    const apiUrl = `${url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'res.users',
        method: 'search',
        args: [[['name', '=', name]]],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<OdooResponse<number[]>>(apiUrl, data, {
          headers,
        }),
      );

      if (response.data.error) {
        const error = response.data.error;
        throw new Error(this.formatOdooError(error));
      }

      if (!response.data.result || response.data.result.length === 0) {
        return null; // User not found
      }

      return response.data.result[0]; // Return the first user ID found
    } catch (error) {
      if (this.isSessionExpiredError(error)) {
        this.logger.log('Session expired, attempting to reauthenticate');
        await this.authenticate();
        return this.findUserByName(name);
      }

      throw error;
    }
  }

  async createCallActivity(
    leadId: number,
    userId: number,
    summary: string,
  ): Promise<number | null> {
    // const config = this.configService.getOdooConfig();
    // const { url } = config;

    if (!this.sessionCookie) {
      await this.authenticate();
    }

    // First, verify the lead exists
    const leadExists = await this.verifyLeadExists(leadId);
    if (!leadExists) {
      throw new Error(`Lead with ID ${leadId} does not exist`);
    }

    // const apiUrl = `${url}/web/dataset/call_kw`;

    // Get the model ID for 'crm.lead'
    const resModelId = await this.getModelId('crm.lead');
    if (!resModelId) {
      throw new Error('Failed to get model ID for crm.lead');
    }

    // Get the activity type ID for 'Call'
    const activityTypeId = await this.getActivityTypeId('Call');
    if (!activityTypeId) {
      throw new Error('Failed to get activity type ID for Call');
    }

    // Create the activity data
    const activityData = {
      res_id: leadId,
      res_model: 'crm.lead',
      res_model_id: resModelId,
      activity_type_id: activityTypeId,
      summary: summary,
      user_id: userId,
      date_deadline: new Date().toISOString().split('T')[0], // Today's date
    };

    try {
      // Create the activity
      const activityId = await this.createActivity(activityData);

      // Mark the activity as done
      await this.markActivityAsDone(activityId);

      return activityId;
    } catch (error) {
      if (this.isSessionExpiredError(error)) {
        this.logger.log('Session expired, attempting to reauthenticate');
        await this.authenticate();
        return this.createCallActivity(leadId, userId, summary);
      }

      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to create call activity: ${errorMessage}`);
      throw new Error(`Failed to create call activity: ${errorMessage}`);
    }
  }
  private async verifyLeadExists(leadId: number): Promise<boolean> {
    const config = this.configService.getOdooConfig();
    const apiUrl = `${config.url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'crm.lead',
        method: 'search_count',
        args: [[['id', '=', leadId]]],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<OdooResponse<number>>(apiUrl, data, { headers }),
      );

      if (response.data.error) {
        throw new Error(this.formatOdooError(response.data.error));
      }

      // search_count returns a number, not an array
      return response.data?.result !== undefined && response.data.result > 0;
    } catch (error) {
      this.logger.error(
        `Failed to verify lead existence: ${this.getErrorMessage(error)}`,
      );
      return false;
    }
  }

  private async getModelId(modelName: string): Promise<number | null> {
    const config = this.configService.getOdooConfig();
    const apiUrl = `${config.url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'ir.model',
        method: 'search',
        args: [[['model', '=', modelName]]],
        kwargs: { limit: 1 },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    const response = await firstValueFrom(
      this.httpService.post<OdooResponse<number[]>>(apiUrl, data, { headers }),
    );

    return response.data?.result?.[0] || null;
  }

  private async getActivityTypeId(name: string): Promise<number | null> {
    const config = this.configService.getOdooConfig();
    const apiUrl = `${config.url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'mail.activity.type',
        method: 'search',
        args: [[['name', '=', name]]],
        kwargs: { limit: 1 },
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    const response = await firstValueFrom(
      this.httpService.post<OdooResponse<number[]>>(apiUrl, data, { headers }),
    );

    return response.data?.result?.[0] || null;
  }

  private async createActivity(activityData: any): Promise<number> {
    const config = this.configService.getOdooConfig();
    const apiUrl = `${config.url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'mail.activity',
        method: 'create',
        args: [activityData],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    const response = await firstValueFrom(
      this.httpService.post<OdooResponse<number>>(apiUrl, data, { headers }),
    );

    if (response.data.error) {
      throw new Error(this.formatOdooError(response.data.error));
    }

    if (!response.data.result) {
      throw new Error('No activity ID received from Odoo API');
    }

    return response.data.result;
  }

  private async markActivityAsDone(activityId: number): Promise<void> {
    const config = this.configService.getOdooConfig();
    const apiUrl = `${config.url}/web/dataset/call_kw`;

    const data = {
      jsonrpc: '2.0',
      method: 'call',
      params: {
        model: 'mail.activity',
        method: 'action_done',
        args: [[activityId]],
        kwargs: {},
      },
    };

    const headers = {
      'Content-Type': 'application/json',
      Cookie: this.sessionCookie as string,
    };

    const response = await firstValueFrom(
      this.httpService.post<OdooResponse<boolean>>(apiUrl, data, { headers }),
    );

    if (response.data.error) {
      throw new Error(this.formatOdooError(response.data.error));
    }

    // console.log(response);
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

  private formatOdooError(error: OdooError): string {
    return (
      `Odoo Error (${error.code}): ${error.message}\n` +
      `Details: ${error.data.message}\n` +
      `Debug: ${error.data.debug}`
    );
  }
}
