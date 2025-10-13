import { Client } from 'pg';

const client = new Client({
  user: 'cex',
  host: 'localhost',
  database: 'cex',
  password: 'cex',
  port: 5432,
});
client.connect();

async function refreshMaterialisedViews() {

  await client.query('REFRESH MATERIALIZED VIEW klines_1h');
  await client.query('REFRESH MATERIALIZED VIEW klines_1w');
  await client.query('REFRESH MATERIALIZED VIEW klines_1m');
  console.log("Materialized views refreshed");
}

refreshMaterialisedViews().catch(console.error);

setInterval(() => {
  refreshMaterialisedViews()
}, 1000 * 10);
