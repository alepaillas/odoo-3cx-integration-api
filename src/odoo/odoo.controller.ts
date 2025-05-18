// src/odoo/odoo.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { OdooService } from './odoo.service';
import { OdooSystemParameter } from './odoo.interface';
import { SetSystemParameterDto } from './dto/set-system-parameer.dto';

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
}
