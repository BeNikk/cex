import express, { Request, Response } from "express";
import cors from "cors";
import orderRouter from "./routes/order";
import { RedisManager } from "./redis/redis";
import viewRouter from "./routes/viewRouter";

const app = express();
const PORT = 3000;
app.use(express.json());
app.use(cors());

app.get("/api/v1/test", (req: Request, res: Response) => {
  try {
    res.send("Test route working!");
  } catch (error) {
    console.log("Test route failed");
    res.status(500).json({ message: "Internal server error in Test route" });
    return;
  }
})

app.use("/api/v1/order", orderRouter);
app.use("/api/v1/klines", viewRouter);
app.get("/api/v1/tickers", (req: Request, res: Response) => {
  try {
    const tickers = [
      {
        symbol: "SOL_USDC",
        firstPrice: "22.50",
        lastPrice: "23.10",
        high: "23.50",
        low: "22.10",
        priceChange: "0.60",
        priceChangePercent: "2.6",
        volume: "1200",
        quoteVolume: "28000",
        trades: "540"
      }];
    res.json(tickers);
  } catch (error) {
    console.log("Error in getting tickers", error);
    res.status(500).json({ message: "Internal server error in getting tickers" });
  }
})

app.get("/api/v1/depth", async (req: Request, res: Response) => {
  try {
    const { symbol } = req.query;
    const response = await RedisManager.getInstance().sendAndWait({
      type: "GET_DEPTH",
      data: {
        market: symbol as string
      }
    })
    res.status(200).json(response);
  } catch (error) {
    console.log("Error in getting depth");
    res.status(500).json({ message: "Error in getting depth", error });
  }
})
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`)
});

