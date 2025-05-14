import { Test, TestingModule } from '@nestjs/testing';
import { ThreeCxService } from './three-cx.service';

describe('ThreeCxService', () => {
  let service: ThreeCxService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThreeCxService],
    }).compile();

    service = module.get<ThreeCxService>(ThreeCxService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
