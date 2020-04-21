import { Module } from '@nestjs/common';
import { CrdtController } from './crdt.controller';
import { CrdtService } from './crdt.service';
import { CrdtGateway } from './crdt.gateway';

@Module({
  controllers: [CrdtController],
  providers: [CrdtService, CrdtGateway],
  exports: [CrdtService]
})
export class CrdtModule {}
