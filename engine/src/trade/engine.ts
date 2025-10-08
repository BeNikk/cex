import fs from "fs";
import dotenv from "dotenv";
import { Order, OrderBook } from "./orderBooks";
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
      orderbooks: this.orderBooks.map((o: any) => o.getSnap()),
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
          const { executed, fills, orderId } = this.createOrder(message.data.userId, message.data.price, message.data.quantity, message.data.market, message.data.side);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executed,
              fills
            }
          });
        } catch (error) {
          console.log("Error in creating order in the engine", error);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executed: 0,
              remaining: 0
            }
          })
        }
        break;
      case 'CANCEL_ORDER':
        try {
          const orderId = message.data.orderId;
          const cancelMarket = message.data.market;
          const cancelOrderbook = this.orderBooks.find((o: any) => o.ticker() === cancelMarket);
          if (!cancelOrderbook) {
            throw new Error("No orderbook found");
          }
          const quoteAsset = cancelMarket.split("_")[1];
          const order = cancelOrderbook.asks.find((o: Order) => o.orderId === orderId) || cancelOrderbook.bids.find((o: Order) => o.orderId === orderId);
          if (order.userId != message.data.userId) {
            throw new Error("Unauthorized: cannot cancel others' orders");
          }
          if (!order) {
            console.log("No order found");
            throw new Error("No order found");
          }
          if (order.side === "buy") {
            const price = cancelOrderbook.cancelBuys(order)
            const leftQuantityPrice = (order.quantity - order.filled) * order.price;
            //@ts-ignore
            this.balances.get(order.userId)[BASE_CURRENCY].available += leftQuantityPrice;
            //@ts-ignore
            this.balances.get(order.userId)[BASE_CURRENCY].locked -= leftQuantityPrice;
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          } else {
            const price = cancelOrderbook.cancelSells(order)
            const leftQuantity = order.quantity - order.filled;
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].available += leftQuantity;
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          }

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              executedQty: 0,
              remainingQty: 0
            }
          });


        } catch (error) {
          console.log("Error in cancelling order", error);
        }
        break;
      case 'GET_OPEN_ORDERS':
        try {
          const openOrderbook = this.orderBooks.find((o: any) => o.ticker() === message.data.market);
          if (!openOrderbook) {
            throw new Error("No orderbook found");
          }
          const openOrders = openOrderbook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders
          });
        } catch (error) {
          console.log("ERROR IN GETTING OPEN ORDERS", error);
        }
        break;
      case 'GET_DEPTH':
        try {
          const market = message.data.market;
          const orderbook = this.orderBooks.find((o: any) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("No orderbook found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth()
          });
        } catch (error) {
          console.log("Error in getting market depth", error);
        }
        break;
      case 'ADD_BALANCE':
        try {
          const userId = message.data.userId;
          const amount = Number(message.data.amount);
          const userBalance = this.balances.get(userId);
          if (!userBalance) {
            this.balances.set(userId, {
              [BASE_CURRENCY]: {
                available: amount,
                locked: 0
              }
            });
          } else {
            userBalance[BASE_CURRENCY]!.available += amount;
          }
        } catch (error) {
          console.log("Error in adding funds", error);
        }
    }
  }


  createOrder(userId: string, price: string, quantity: string, market: string, side: "BUY" | "SELL") {
    const orderBook = this.orderBooks.find((o: any) => { return o.ticker() == market });
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
    return { executed, fills, orderId: order.orderId };
  }

  checkAndUpdateFunds(baseAsset: string, quoteAsset: string, side: "BUY" | "SELL", userId: string, asset: string, price: string, quantity: string) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      throw new Error("User balance not found");
    }
    if (side == "BUY") {

      if ((userBalance[quoteAsset]?.available || 0) < Number(quantity) * Number(price)) {
        throw new Error("Insufficient balance");
      }
      userBalance[quoteAsset]!.available -= Number(quantity) * Number(price);
      userBalance[quoteAsset]!.locked += Number(quantity) * Number(price);

      //@ts-ignore
      //this.balances.get(userId)[quoteAsset]?.available = this.balances.get(userId)?.[quoteAsset].available - (Number(quantity) * Number(price));
      //@ts-ignore
      //this.balances.get(userId)[quoteAsset].locked = this.balances.get(userId)?.[quoteAsset].locked + (Number(quantity) * Number(price));
    }
    else {

      if ((userBalance[baseAsset]?.available || 0) < Number(quantity)) {
        throw new Error("Insufficient funds");
      }
      userBalance[baseAsset]!.available -= Number(quantity);
      userBalance[baseAsset]!.locked += Number(quantity);

      //@ts-ignore
      //this.balances.get(userId)[baseAsset].available = this.balances.get(userId)?.[baseAsset].available - (Number(quantity));
      //@ts-ignore
      //this.balances.get(userId)[baseAsset].locked = this.balances.get(userId)?.[baseAsset].locked + Number(quantity);
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
  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.orderBooks.find((o: any) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    const updatedBids = depth?.bids.filter((x: any) => x[0] === price);
    const updatedAsks = depth?.asks.filter((x: any) => x[0] === price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth"
      }
    });
  }

}
