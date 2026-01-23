import { Test, TestingModule } from '@nestjs/testing';
import { BiController } from './bi.controller';
import { BiService } from './bi.service';

describe('BiController', () => {
  let controller: BiController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiController],
      providers: [
        {
          provide: BiService,
          useValue: {},
        },
        {
          provide: 'BranchInterceptor',
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<BiController>(BiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
