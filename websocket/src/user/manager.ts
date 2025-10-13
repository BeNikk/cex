import { WebSocket } from "ws";
import crypto from "crypto";
import { User } from "./user";
export class Manager {
  static instance: Manager;
  private users = new Map();
  private constructor() { }
  public static getInstance() {
    if (!this.instance) {
      const manager = new Manager();
      return manager;
    }
    return this.instance;
  }
  public addUsers(ws: WebSocket) {
    const id = crypto.randomUUID();
    const user = new User(id, ws);
    this.users.set(id, user);
    //registering and deleting the user instance
    return user;
  }
  public getUser(id: string) {
    return this.users.get(id);
  }

}
