import { WebSocket } from "ws";
import crypto from "crypto";
import { User } from "./user";
import { SubscriptionManager } from "../redis/subscriptions";
export class Manager {
  static instance: Manager;
  private users = new Map();
  private constructor() { }
  public static getInstance() {
    if (!this.instance) {
      const manager = new Manager();
      this.instance = manager;
      return this.instance;
    }
    return this.instance;
  }
  public addUsers(ws: WebSocket) {
    const id = crypto.randomUUID();
    const user = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    return user;
  }
  private registerOnClose(ws: WebSocket, id: string) {
    ws.on("close", () => {
      this.users.delete(id);
      SubscriptionManager.getSubscriptionInstance().userLeft(id);
    });
  }
  public getUser(id: string) {
    return this.users.get(id);
  }
}
