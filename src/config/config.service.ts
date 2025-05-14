// src/config/config.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { ThreeCxConfig } from './config.interface';

@Injectable()
export class ConfigService {
  constructor(private readonly configService: NestConfigService) {}

  getThreeCxConfig(): ThreeCxConfig {
    const config = this.configService.get<ThreeCxConfig>('threecx');

    if (!config) {
      throw new Error('3CX configuration is missing');
    }

    // Validate required fields
    const errors: string[] = [];

    if (!config.url) {
      errors.push('url');
    }

    if (!config.client_id) {
      errors.push('client_id');
    }

    if (!config.client_secret) {
      errors.push('client_secret');
    }

    if (!config.grant_type) {
      errors.push('grant_type');
    }

    if (!config.grant_type) {
      errors.push('group_filter');
    }

    if (!config.grant_type) {
      errors.push('call_class');
    }

    if (errors.length > 0) {
      throw new Error(
        `3CX configuration is incomplete. Missing fields: ${errors.join(', ')}`,
      );
    }

    return config;
  }
}
