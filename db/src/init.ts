import { Client } from "pg";

const client = new Client({
  user: "cex",
  host: "localhost",
  database: "cex",
  password: "cex",
  port: 5432,
});

async function seedDB() {
  try {
    await client.connect();
    console.log("Connected to Postgres");

    await client.query(`DROP TABLE IF EXISTS sol_prices;`);

    await client.query(`
      CREATE TABLE sol_prices (
        time TIMESTAMPTZ NOT NULL,
        price DOUBLE PRECISION,
        volume DOUBLE PRECISION,
        currency_code VARCHAR(10)
      );
    `);
    console.log("Created table 'sol_prices'");

    await client.query(`
      SELECT create_hypertable('sol_prices', 'time', if_not_exists => TRUE);
    `);
    console.log("Created hypertable 'sol_prices'");

    const views = [
      { name: "klines_1m", interval: "1 minute" },
      { name: "klines_1h", interval: "1 hour" },
      { name: "klines_1w", interval: "1 week" },
    ];

    for (const view of views) {
      await client.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS ${view.name} AS
        SELECT
          time_bucket('${view.interval}', time) AS bucket,
          first(price, time) AS open,
          max(price) AS high,
          min(price) AS low,
          last(price, time) AS close,
          sum(volume) AS volume,
          currency_code
        FROM sol_prices
        GROUP BY bucket, currency_code;
      `);
      console.log(`Created materialized view '${view.name}'`);
    }

    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Error seeding DB:", err);
  } finally {
    await client.end();
  }
}

seedDB().catch(console.error);

