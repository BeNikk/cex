import { Client } from 'pg';
import { createClient } from 'redis';
import { db, password, user } from './config';

const pgClient = new Client({
  user: user,
  host: 'localhost',
  database: db,
  password: password,
  port: 5432,
});
pgClient.connect();

export async function startProcessor() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("Connected to Redis");

  while (true) {
    const response = await redisClient.rPop("db_processor");
    if (!response) continue;

    const data: any = JSON.parse(response);
    console.log(data);
    if (data.type === "TRADE_ADDED") {
      const price = data.data.price;
      const timestamp = new Date(data.data.timestamp);
      const query = 'INSERT INTO SOL_PRICES (time, price) VALUES ($1, $2)';
      const values = [timestamp, price];
      await pgClient.query(query, values);
    }
  }
}
