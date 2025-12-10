import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

export type DbDriver = "pg" | "neon";

export function resolveDbDriver(env: NodeJS.ProcessEnv = process.env): DbDriver {
  const normalize = (value?: string) => value?.toLowerCase();

  if (normalize(env.FORCE_PG_DRIVER) === "true") {
    return "pg";
  }

  const isCloudRun = Boolean(env.K_SERVICE);
  const isDocker = normalize(env.DOCKER_ENV) === "true";
  const nodeEnv = normalize(env.NODE_ENV);
  const isDev = nodeEnv === "development";
  const isTest = nodeEnv === "test";

  if (isCloudRun || isDocker || isDev || isTest) {
    return "pg";
  }

  const neonRequested = normalize(env.USE_NEON_WEBSOCKETS) === "true";
  return neonRequested ? "neon" : "pg";
}

const selectedDriver = resolveDbDriver();
const usePgDriver = selectedDriver === "pg";

if (!usePgDriver) {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Initialize database pool
 * Note: We don't throw here at module load time to allow validateEnvironmentVariables()
 * to run first and provide better error messages. The error will be thrown when
 * the pool is actually used if DATABASE_URL is missing.
 */
function createPool(): pg.Pool | Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  // Determine if SSL is required (Cloud Run or Neon database)
  // Neon and most cloud PostgreSQL services require SSL connections
  const requiresSSL = Boolean(process.env.K_SERVICE) || databaseUrl.includes('neon.tech');

  return usePgDriver
    ? new pg.Pool({ 
        connectionString: databaseUrl,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
        // SSL configuration for cloud databases (Neon, Cloud Run)
        ssl: requiresSSL ? { rejectUnauthorized: false } : undefined,
      })
    : new Pool({ 
        connectionString: databaseUrl,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
}

// Create pool - this will throw if DATABASE_URL is missing, but only when imported
// The validateEnvironmentVariables() in app.ts should catch this first
export const pool = createPool();

export const db = usePgDriver
  ? drizzlePg(pool as pg.Pool, { schema })
  : drizzle({ client: pool as Pool, schema });
