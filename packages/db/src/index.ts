import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://elchuitoxq:elchuitoxq@localhost:5432/erp_project_db";

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
export * from "./schema";
