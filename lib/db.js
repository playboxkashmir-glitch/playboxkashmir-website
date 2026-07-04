// PostgreSQL connection pool used by all backend API modules.
// Requires DATABASE_URL to be set in your environment (Vercel Project Settings > Environment Variables).
// Works with any standard Postgres provider: Vercel Postgres, Neon, Supabase, Railway, etc.

import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
        max: 5,
      idleTimeoutMillis: 30000
    });
  }
  return pool;
}

export async function query(text, params) {
  const client = getPool();
  return client.query(text, params);
}
