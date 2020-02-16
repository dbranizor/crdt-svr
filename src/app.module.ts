import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrdtModule } from './crdt/crdt.module';
import { CrdtGateway } from './crdt/crdt.gateway';

@Module({
  imports: [CrdtModule],
  controllers: [AppController],
  providers: [AppService, CrdtGateway],
})
export class AppModule {}
