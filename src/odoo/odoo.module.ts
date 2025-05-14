// src/odoo/odoo.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { OdooService } from './odoo.service';
import { OdooController } from './odoo.controller';
import { ConfigModule } from '@nestjs/config';
import configuration from 'src/config/configuration';
import { ConfigService } from 'src/config/config.service';

@Module({
  imports: [
    HttpModule, // This provides HttpService
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Makes ConfigModule available globally
    }),
  ],
  providers: [OdooService, ConfigService],
  controllers: [OdooController],
  exports: [OdooService],
})
export class OdooModule {}
