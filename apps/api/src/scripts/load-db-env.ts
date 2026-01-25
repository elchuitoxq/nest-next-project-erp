import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from packages/db/src/.env
// Path: src/scripts/load-db-env.ts -> ../../../../packages/db/src/.env
config({ path: resolve(__dirname, "../../../../packages/db/src/.env") });
