
import { WebSocketServer } from "ws";
import { Manager } from "./user/manager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", (ws) => {
  Manager.getInstance().addUsers(ws);
});

