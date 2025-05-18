// src/odoo/odoo.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OdooService } from './odoo.service';
import { OdooSystemParameter } from './odoo.interface';
import { CreateLeadDto, SetSystemParameterDto } from './dto/odoo.dto';

@Controller('odoo')
export class OdooController {
  constructor(private readonly odooService: OdooService) {}

  @Get('system-parameters')
  async getSystemParameters(): Promise<OdooSystemParameter[]> {
    return this.odooService.getSystemParameters();
  }

  @Post('system-parameter')
  @HttpCode(HttpStatus.CREATED)
  async setSystemParameter(
    @Body() parameterDto: SetSystemParameterDto,
  ): Promise<OdooSystemParameter> {
    if (!parameterDto || !parameterDto.key || !parameterDto.value) {
      throw new BadRequestException('Key and value are required');
    }

    return this.odooService.setSystemParameter(
      parameterDto.key,
      parameterDto.value,
    );
  }

  @Post('lead')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  async createLead(@Body() leadData: CreateLeadDto): Promise<unknown> {
    // console.log(leadData);
    if (!leadData) {
      throw new BadRequestException('Lead data is required');
    }
    const id = await this.odooService.createLead(leadData);
    return { id: id };
  }
}
