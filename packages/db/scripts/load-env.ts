import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from src/.env before any other imports
config({ path: resolve(__dirname, "../src/.env") });
