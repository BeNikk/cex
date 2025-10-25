import { createClient, RedisClientType } from "redis";

// this client is for writing/ responding to api/db/ws
export class RedisManager {
  private client: RedisClientType;
  private static instance: RedisManager;

  constructor() {
    this.client = createClient({
      url: "redis://redis:6379"
    });
    this.client.connect();
  }

  public sendToApi(clientId: string, message: any) {
    this.client.publish(clientId, JSON.stringify(message));
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public pushMessage(message: any) {
    this.client.lPush("db_processor", JSON.stringify(message));
  }

  public publishMessage(channel: string, message: any) {
    this.client.publish(channel, JSON.stringify(message));
  }

}
