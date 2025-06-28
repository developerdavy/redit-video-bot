import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Clean up DATABASE_URL format (remove psql command wrapper if present)
const cleanDatabaseUrl = process.env.DATABASE_URL
  .replace(/^psql\s+'/, '')
  .replace(/'$/, '');

export const pool = new Pool({ connectionString: cleanDatabaseUrl });
export const db = drizzle({ client: pool, schema });