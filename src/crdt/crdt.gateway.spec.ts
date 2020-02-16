import { Test, TestingModule } from '@nestjs/testing';
import { CrdtGateway } from './crdt.gateway';

describe('CrdtGateway', () => {
  let gateway: CrdtGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrdtGateway],
    }).compile();

    gateway = module.get<CrdtGateway>(CrdtGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
