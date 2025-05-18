import { Injectable, Logger } from '@nestjs/common';
import { ThreeCxService } from './three-cx/three-cx.service';
import { OdooService } from './odoo/odoo.service';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly threeCxService: ThreeCxService,
    private readonly odooService: OdooService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async integrateThreeCxData(): Promise<string> {
    try {
      const odooSystemParameters = await this.odooService.getSystemParameters();
      // console.log(odooSystemParameters);
      const threeCxLastIntegrationDateTimeParam = odooSystemParameters.find(
        (param) => param.key === 'threecx.last_integration_datetime',
      );
      if (!threeCxLastIntegrationDateTimeParam) {
        throw new Error(
          'threecx.last_integration_datetime system parameter not found',
        );
      }
      const threeCxLastIntegrationDateTime =
        threeCxLastIntegrationDateTimeParam.value;
      // console.log('Last integration datetime:', threeCxLastIntegrationDateTime);

      const threeCxAccessToken = await this.threeCxService.getToken();

      const reportCallCost =
        await this.threeCxService.getReportCallCostByExtensionGroup(
          threeCxAccessToken,
          threeCxLastIntegrationDateTime,
        );
      console.log(reportCallCost);
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to fetch call cost data: ${errorMessage}`);
      throw new Error(`Failed to fetch call cost data: ${errorMessage}`);
    }

    return 'Hello World!';
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
