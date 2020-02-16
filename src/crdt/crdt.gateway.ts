import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

@WebSocketGateway()
export class CrdtGateway {
  @WebSocketServer() server;
  users = 0;
  handleConnection(client: any, ...args: any[]) {
      this.users++;
      this.server.emit('users', this.users);

  }

  handleDisconnect(client: any) {
      this.users--;
      this.server.emit('users', this.users);
  }

  @SubscribeMessage('chat')
  async onChat(client, message){
      client.broadcast.emit('chat', message);
  }
}
