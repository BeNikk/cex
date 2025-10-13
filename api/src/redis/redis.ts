import { createClient, RedisClientType } from "redis";
import { v4 as uuidv4 } from 'uuid';

export class RedisManager {
  private publisher: RedisClientType; // publishing to engine via queue
  private client: RedisClientType; // recieving via pub sub
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
    this.publisher = createClient();
    this.publisher.connect()
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
      return this.instance;
    }
    return this.instance;
  }
  //publishing to queue and then waiting for it 
  public sendAndWait(message: any) {
    return new Promise((resolve) => {
      const id = this.getRandomId();
      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resolve(JSON.parse(message));
      })
      this.publisher.lPush("messages", JSON.stringify({ clientId: id, message }));
    })
  }
  public getRandomId() {
    return uuidv4();
  }
}
