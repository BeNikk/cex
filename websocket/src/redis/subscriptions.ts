import { createClient, RedisClientType } from "redis";
import { Manager } from "../user/manager";

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions = new Map(); //map users->subscription 
  private reverseSubscriptions = new Map(); // map subscriptions-> users-
  private redisClient: RedisClientType;

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.connect();
  }
  public static getSubscriptionInstance() {
    if (!this.instance) {
      const manager = new SubscriptionManager();
      this.instance = manager;
      return manager;
    }
    return this.instance;
  }

  private redisCallbackHandler = (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    console.log(parsedMessage);
    this.reverseSubscriptions.get(channel)?.forEach((s: any) => Manager.getInstance().getUser(s)?.emit(parsedMessage));
    console.log("message emitted");
  }
  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) {
      return
    }

    this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));
    this.reverseSubscriptions.set(subscription, (this.reverseSubscriptions.get(subscription) || []).concat(userId));
    if (this.reverseSubscriptions.get(subscription)?.length === 1) {
      this.redisClient.subscribe(subscription, this.redisCallbackHandler);
    }
  }
  public unsubscribe(userId: string, subscription: string) {
    const subscriptions = this.subscriptions.get(userId);
    if (subscriptions) {
      this.subscriptions.set(userId, subscriptions.filter((s: any) => s !== subscription));
    }
    const reverseSubscriptions = this.reverseSubscriptions.get(subscription);
    if (reverseSubscriptions) {
      this.reverseSubscriptions.set(subscription, reverseSubscriptions.filter((s: any) => s !== userId));
      if (this.reverseSubscriptions.get(subscription)?.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }

  public userLeft(userId: string) {
    this.subscriptions.get(userId)?.forEach((s: any) => this.unsubscribe(userId, s));
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
