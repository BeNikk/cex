import { Client } from 'pg';
import { createClient } from 'redis';
import { db, password, user } from './config';

const pgClient = new Client({
  user: "cex",
  host: 'postgres',
  database: "cex",
  password: "cex",
  port: 5432,
});

export async function startProcessor() {
  const redisClient = createClient({
    url: "redis://redis:6379"
  });
  await redisClient.connect();
  await pgClient.connect();

  console.log("Connected to Redis and postgres");

  while (true) {

    const response = await redisClient.rPop("db_processor");
    if (!response) continue;

    const data: any = JSON.parse(response);
    console.log(data);
    if (data.type == "TRADE_ADDED") {
      const price = data.data.price;
      const timestamp = new Date(data.data.timestamp);
      const volume = data.data.quantity;
      const query = 'INSERT INTO SOL_PRICES (time, price,volume) VALUES ($1, $2,$3)';
      const values = [timestamp, price, volume];
      await pgClient.query(query, values);
      console.log("added ");
    }
  }
}
startProcessor();
