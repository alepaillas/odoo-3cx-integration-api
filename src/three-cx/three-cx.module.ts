// src/three-cx/three-cx.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ThreeCxService } from './three-cx.service';
import { ThreeCxController } from './three-cx.controller';
import { ConfigService } from '../config/config.service';
import configuration from '../config/configuration';

@Module({
  imports: [
    HttpModule, // This provides HttpService
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true, // Makes ConfigModule available globally
    }),
  ],
  providers: [ThreeCxService, ConfigService],
  controllers: [ThreeCxController],
  exports: [ThreeCxService], // Export if you need to use ThreeCxService in other modules
})
export class ThreeCxModule {}
