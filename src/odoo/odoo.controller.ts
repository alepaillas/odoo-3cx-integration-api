// src/odoo/odoo.controller.ts
import { Controller, Get } from '@nestjs/common';
import { OdooService } from './odoo.service';
import { OdooSystemParameter } from './odoo.interface';

@Controller('odoo')
export class OdooController {
  constructor(private readonly odooService: OdooService) {}

  @Get('system-parameters')
  async getSystemParameters(): Promise<OdooSystemParameter[]> {
    return this.odooService.getSystemParameters();
  }
}
