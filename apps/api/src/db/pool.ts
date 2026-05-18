import pg from "pg";
import type { QueryResultRow } from "pg";
import { env } from "../env.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined
});

export async function query<T extends QueryResultRow = any>(text: string, params: unknown[] = []) {
  return pool.query<T>(text, params);
}

export async function transaction<T>(fn: (client: pg.PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
