import { createClient } from 'redis';
import { Engine } from './trade/engine';
async function main() {
  const client = createClient();
  await client.connect();
  const engine = new Engine();
  while (true) {
    const response = await client.rPop("messages" as string);
    if (!response) {
      continue;
    }
    else {
      //  process in the engine class
      engine.process(JSON.parse(response))
    }
  }
}
main();
