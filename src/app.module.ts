import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CrdtModule } from './crdt/crdt.module';
import { CrdtGateway } from './crdt/crdt.gateway';


@Module({
  imports: [CrdtModule, ConfigModule.forRoot({
    ignoreEnvFile: true
  })],
  controllers: [AppController],
  providers: [AppService, CrdtGateway],
})
export class AppModule {}
