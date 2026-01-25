import "./load-env";
import { client } from "./src";

async function reset() {
  console.log("Resetting database...");
  await client`DROP SCHEMA public CASCADE`;
  await client`CREATE SCHEMA public`;
  await client`GRANT ALL ON SCHEMA public TO public`;
  console.log("Database reset complete.");
  process.exit(0);
}

reset();
