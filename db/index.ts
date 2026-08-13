import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// Requires DATABASE_URL (Neon PostgreSQL connection string) in .env.
// Throws at import time only when actually called without the env var set,
// so the rest of the app (which uses lib/demo-data) keeps working without a DB.
export function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. See ENVIRONMENT_SETUP.md.");
  }
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}
