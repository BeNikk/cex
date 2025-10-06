import fs from "fs";
import dotenv from "dotenv";
dotenv.config();
interface UserBalance {
  [key: string]: {
    available: number,
    locked: number
  }
}

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

    }
  }
}
