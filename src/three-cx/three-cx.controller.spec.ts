import { Test, TestingModule } from '@nestjs/testing';
import { ThreeCxController } from './three-cx.controller';

describe('ThreeCxController', () => {
  let controller: ThreeCxController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThreeCxController],
    }).compile();

    controller = module.get<ThreeCxController>(ThreeCxController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
