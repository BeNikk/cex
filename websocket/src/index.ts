
import { WebSocketServer } from "ws";
import { Manager } from "./user/manager";

const wss = new WebSocketServer({ port: 8080, host: "0.0.0.0" });

wss.on("connection", (ws) => {
  Manager.getInstance().addUsers(ws);
});

