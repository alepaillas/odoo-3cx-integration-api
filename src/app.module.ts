// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThreeCxModule } from './three-cx/three-cx.module';
import { OdooModule } from './odoo/odoo.module';

@Module({
  imports: [ThreeCxModule, OdooModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
