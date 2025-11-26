import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard pg driver for local development
const isDev = process.env.NODE_ENV === "development";

export const pool = isDev
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({ connectionString: process.env.DATABASE_URL });

export const db = isDev
  ? drizzlePg(pool, { schema })
  : drizzle({ client: pool, schema });
