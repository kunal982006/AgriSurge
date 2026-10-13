/**
 * ========================================================================================
 * 🔌 DATABASE CLIENT & CONNECTION MANAGER (PostgreSQL via Neon Serverless & Drizzle)
 * ========================================================================================
 * 
 * WHAT IS THIS FILE?
 * This file acts as the database connection gateway. It establishes a secure connection to
 * a PostgreSQL database (hosted on Neon Serverless) and initializes the Drizzle ORM client.
 * 
 * HOW IT WORKS (STEP-BY-STEP):
 * 1. Reads the `DATABASE_URL` environment variable containing credentials (host, user, password, port, db).
 * 2. Initializes the `@neondatabase/serverless` HTTP connection driver (optimized for serverless environments).
 * 3. Wraps the SQL connection with Drizzle ORM, binding our defined schema (`schema.ts`).
 * 4. Exports `getDb()` which is invoked in API routes whenever we need to query or insert data.
 * ========================================================================================
 */

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

/**
 * Returns an active Drizzle ORM database instance.
 * 
 * Throws an explicit error if DATABASE_URL is missing, ensuring clean error handling
 * without crashing the app at build time if running with demo data.
 */
export function getDb() {
  // 1. Retrieve the connection string from environment variables
  const connectionString = process.env.DATABASE_URL;

  // 2. Validate that the connection string is configured
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Please configure it in your .env file. See ENVIRONMENT_SETUP.md.");
  }

  // 3. Create serverless HTTP SQL client
  const sql = neon(connectionString);

  // 4. Return Drizzle instance bound with our tables & relations
  return drizzle(sql, { schema });
}

