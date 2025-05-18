import { Injectable, Logger } from '@nestjs/common';
import { ThreeCxService } from './three-cx/three-cx.service';
import { OdooService } from './odoo/odoo.service';
import { CallCostResponse } from './three-cx/three-cx.interface';
import { parseDuration } from './utils/duration.utils';

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

      const reportCallCost: CallCostResponse =
        await this.threeCxService.getReportCallCostByExtensionGroup(
          threeCxAccessToken,
          threeCxLastIntegrationDateTime,
        );
      // console.log(reportCallCost);

      // Iterate over each entry in the reportCallCost value array
      for (const entry of reportCallCost.value) {
        const leadName = `Llamada de ${entry.DstDn} atendida por ${entry.SrcDisplayName}`;
        const talkingDuration = parseDuration(entry.TalkingDur);
        const summary = `Llamada hecha a las ${entry.StartTime} con duración de ${talkingDuration}`;

        // Find the user ID for the salesperson
        const userId = await this.odooService.findUserByName(
          entry.SrcDisplayName,
        );
        if (!userId) {
          throw new Error('User ID for salesperson not found');
        }
        // console.log(userId);

        // Create a lead for each entry
        const lead = await this.odooService.createLead({
          name: leadName,
          phone: entry.DstDn,
          user_id: userId,
        });
        // console.log(lead);
        // Create a call activity for the lead
        // const activity = await this.odooService.createCallActivity(
        //   lead,
        //   userId,
        //   summary,
        // );
        // console.log(activity);
        await this.odooService.createCallActivity(lead, userId, summary);
      }

      return 'Leads created successfully!';
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Failed to fetch call cost data: ${errorMessage}`);
      throw new Error(`Failed to fetch call cost data: ${errorMessage}`);
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
