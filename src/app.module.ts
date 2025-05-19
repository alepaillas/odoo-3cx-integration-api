// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThreeCxModule } from './three-cx/three-cx.module';
import { OdooModule } from './odoo/odoo.module';
import { ApiKeyMiddleware } from './auth/api-key.middleware';

@Module({
  imports: [ThreeCxModule, OdooModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes('*');
  }
}
