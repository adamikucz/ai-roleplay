import pg from "pg";
import { env } from "../env.js";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 24,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

export async function query<T = unknown>(text: string, params: unknown[] = []) {
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
