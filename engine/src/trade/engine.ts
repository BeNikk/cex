import fs from "fs";
import dotenv from "dotenv";
import { OrderBook } from "./orderBooks";
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

  }

}
