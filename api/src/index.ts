import express, { Request, Response } from "express";
import cors from "cors";
import orderRouter from "./routes/order";

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
app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`)
});

