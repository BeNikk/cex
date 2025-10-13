import { WebSocket } from "ws";
import { SubscriptionManager } from "../redis/subscriptions";

export class User {
  private id: string;
  private ws: WebSocket;
  private subscriptions: string[] = [];
  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();

  }
  emit(message: any) {
    this.ws.send(JSON.stringify(message));
  }

  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter(s => s !== subscription);
  }
  private addListeners() {
    this.ws.on("message", (message: string) => {
      const parsedMessage: any = JSON.parse(message);
      if (parsedMessage.method === 'SUBSCRIBE') {
        parsedMessage.params.forEach((s: any) => SubscriptionManager.getSubscriptionInstance().subscribe(this.id, s));
      }

      if (parsedMessage.method === 'UNSUBSCRIBE') {
        parsedMessage.params.forEach((s: any) => SubscriptionManager.getSubscriptionInstance().unsubscribe(this.id, parsedMessage.params[0]));
      }
    });
  }

}
