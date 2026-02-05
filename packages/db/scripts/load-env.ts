import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from src/.env before any other imports
// Load environment variables from root
const result = config({ path: resolve(__dirname, "../../../.env") });
if (result.error) {
  console.error("Error loading .env file:", result.error);
} else {
  console.log(
    "Environment loaded successfully. DATABASE_URL is set to:",
    process.env.DATABASE_URL ? "Defined" : "Undefined",
  );
}
