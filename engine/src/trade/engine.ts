import fs from "fs";
import dotenv from "dotenv";
import { OrderBook } from "./orderBooks";
import { RedisManager } from "../redis/redis";
import { randomUUID } from "crypto";
dotenv.config();
interface UserBalance {
  [key: string]: {
    available: number,
    locked: number
  }
}
const BASE_CURRENCY = "USDC"
export class Engine {
  private orderBooks: any = [];
  private balances: Map<string, UserBalance> = new Map();
  constructor() {
    let snapShot = null; //should come from db/s3
    try {
      if (process.env.SNAPSHOT) {
        snapShot = fs.readFileSync('./snapshots.json');
      }
    }
    catch (e) {
      console.log("ERROR IN LOADING SNAPSHOT")
    }
    if (snapShot) {
      const snapShotJson = JSON.parse(snapShot.toString());
      this.orderBooks = snapShotJson.orderbooks.map((o: any) => new OrderBook(o.baseAsset, o.bids, o.asks, o.lastTradeId, o.currentPrice));
      this.balances = new Map(snapShotJson.balances);
    }
    else {
      this.orderBooks = [new OrderBook(`SOL`, [], [], 0, 0)];
      this.setBaseBalances();
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  saveSnapshot() {
    const snapshotSnapshot = {
      orderbooks: this.orderBooks.map((o: any) => o.getSnapshot()),
      balances: Array.from(this.balances.entries())
    }
    //should save to s3
    fs.writeFileSync("./snapshots.json", JSON.stringify(snapshotSnapshot));
  }
  setBaseBalances() {
    this.balances.set("1", {
      [BASE_CURRENCY]: {
        available: 50000,
        locked: 0
      },
      "SOL": {
        available: 50000,
        locked: 0
      }
    });

    this.balances.set("2", {
      [BASE_CURRENCY]: {
        available: 50000,
        locked: 0
      },
      "SOL": {
        available: 50000,
        locked: 0
      }
    });
  }

  process({ message, clientId }: any) {
    switch (message.type) {
      case 'CREATE_ORDER':
        try {
          //          const { executed, fills, orderId} = this;


        } catch (error) {
          console.log("Error in creating order in the engine");
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executed: 0,
              remaining: 0
            }
          })
        }
    }
  }

  createOrder(userId: string, price: string, quantity: string, market: string, side: "BUY" | "SELL") {
    const orderBook = this.orderBooks.find((o: any) => { o.ticker() == market });
    const baseAsset = market.split("_")[0]!;
    const quoteAsset = market.split("_")[1]!;
    if (!orderBook) {
      throw new Error("No orderbook found");
    }
    this.checkAndUpdateFunds(baseAsset, quoteAsset, side, userId, quoteAsset, price, quantity);
    const order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId: randomUUID(),
      filled: 0,
      side: side,
      userId: userId
    }
    const { fills, executed } = orderBook.createOrder(order);
    this.updateFunds(userId, baseAsset, quoteAsset, side, fills, executed);


  }

  checkAndUpdateFunds(baseAsset: string, quoteAsset: string, side: "BUY" | "SELL", userId: string, asset: string, price: string, quantity: string) {
    if (side == "BUY") {
      if ((this.balances.get(userId)?.quoteAsset?.available || 0) < Number(quantity) * Number(price)) {
        throw new Error("Insufficient balance");
      }
      //@ts-ignore
      this.balances.get(userId)[quoteAsset]?.available = this.balances.get(userId)?.[quoteAsset].available - (Number(quantity) * Number(price));
      //@ts-ignore
      this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked + (Number(quantity) * Number(price));

    }
    else {
      if ((this.balances.get(userId)?.[baseAsset]?.available || 0) < Number(quantity)) {
        throw new Error("Insufficient funds");
      }
      //@ts-ignore
      this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(quantity));
      //@ts-ignore
      this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked + Number(quantity);
    }
  }
  updateFunds(userId: string, baseAsset: string, quoteAsset: string, side: "BUY" | "SELL", fills: any, executed: number) {
    try {
      if (side == "BUY") {
        fills.forEach((fill: any) => {
          //@ts-ignore
          // credit seller INR;
          this.balances.get(fill.otherUserId)[quoteAsset].available = this.balances.get(fill.otherUserId)?.[quoteAsset].available + (fill.qty * fill.price);
          //@ts-ignore
          //Debit buyer locked INR
          this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked - (fill.qty * fill.price);
          //@ts-ignore
          //debit seller locked stocks
          this.balances.get(fill.otherUserId)[baseAsset].locked = this.balances.get(fill.otherUserId)?.[baseAsset].locked - fill.qty;
          //@ts-ignore
          // credit buyer stocks
          this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available + fill.qty;
        });
      }
      else {
        fills.forEach((fill: any) => {
          //@ts-ignore
          // buyers money(other user) got subtracted since he/she has to buy the stock
          this.balances.get(fill.otherUserId)[quoteAsset].locked = this.balances.get(fill.otherUserId)?.[quoteAsset].locked - (fill.qty * fill.price);
          //@ts-ignore
          //user who was selling got his money  
          this.balances.get(userId)[quoteAsset].available = this.balances.get(userId)?.[quoteAsset].available + (fill.qty * fill.price);
          //@ts-ignore
          //buyer's stock balance is incrased
          this.balances.get(fill.otherUserId)[baseAsset].available = this.balances.get(fill.otherUserId)?.[baseAsset].available + fill.qty;
          //@ts-ignore
          //seller stock balance decreased
          this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked - (fill.qty);
        });
      }
    } catch (error) {
      console.log("ERROR IN UPDATING FUNDS");
    }
  }
}
