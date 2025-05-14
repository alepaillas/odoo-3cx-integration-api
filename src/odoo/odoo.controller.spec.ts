import { Test, TestingModule } from '@nestjs/testing';
import { OdooController } from './odoo.controller';

describe('OdooController', () => {
  let controller: OdooController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OdooController],
    }).compile();

    controller = module.get<OdooController>(OdooController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
