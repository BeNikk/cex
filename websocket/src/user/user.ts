import { WebSocket } from "ws";

export class User {
  private id: string;
  private ws: WebSocket;
  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
  }
  emit(message: any) {
    this.ws.send(JSON.stringify(message));
  }

}
