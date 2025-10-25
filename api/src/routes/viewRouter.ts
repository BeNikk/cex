import { Router } from "express";
import { Client } from 'pg';

const viewRouter = Router();

const client = new Client({
  user: 'cex',
  host: 'postgres',
  database: 'cex',
  password: 'cex',
  port: 5432,
})
client.connect();

viewRouter.get("/", async (req, res) => {
  const { market, interval, startTime, endTime } = req.query;
  console.log(interval, startTime, endTime);
  // market defaulted as sol
  let query;
  switch (interval) {
    case '1m':
      query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2`;
      break;
    case '1h':
      query = `SELECT * FROM klines_1m WHERE  bucket >= $1 AND bucket <= $2`;
      break;
    case '1w':
      query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
      break;
    default:
      return res.status(400).send('Invalid interval');
  }

  try {
    //@ts-ignore
    const result = await client.query(query, [new Date(startTime * 1000 as string), new Date(endTime * 1000 as string)]);
    console.log(result)
    res.json(result.rows.map((x: any) => ({
      close: x.close,
      end: x.bucket,
      high: x.high,
      low: x.low,
      open: x.open,
      quoteVolume: x.quoteVolume,
      start: x.start,
      trades: x.trades,
      volume: x.volume,
    })));
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
export default viewRouter;
