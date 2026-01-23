import { Test, TestingModule } from '@nestjs/testing';
import { BiService } from './bi.service';
import { CurrenciesService } from '../finance/currencies/currencies.service';

describe('BiService', () => {
  let service: BiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BiService,
        {
          provide: CurrenciesService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BiService>(BiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
