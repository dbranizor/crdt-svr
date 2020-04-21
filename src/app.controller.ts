import { Controller, Get, Render } from '@nestjs/common';
import { AppService } from './app.service';
import { CrdtService } from './crdt/crdt.service';

@Controller()
export class AppController {
  constructor(private readonly credtSvc: CrdtService) {}

  @Get()
  @Render('index')
  getHello(): any {
    let messages: any[] = [];
    this.credtSvc.userMaps.forEach(m => {
      Object.keys(m).forEach(key => messages = [...messages, m[key]])
    })
    return {messages}
  }
}
