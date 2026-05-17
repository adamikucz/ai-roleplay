import { query } from "../db/pool.js";

export type DbUser = { id: string; email: string; password_hash: string; display_name: string };

export async function createUser(input: { email: string; passwordHash: string; displayName: string }) {
  const result = await query<DbUser>(
    `insert into users (email, password_hash, display_name) values ($1,$2,$3)
     returning id,email,password_hash,display_name`,
    [input.email.toLowerCase(), input.passwordHash, input.displayName]
  );
  return result.rows[0]!;
}

export async function findUserByEmail(email: string) {
  const result = await query<DbUser>(
    `select id,email,password_hash,display_name from users where email=$1 limit 1`,
    [email.toLowerCase()]
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: string) {
  const result = await query<DbUser>(
    `select id,email,password_hash,display_name from users where id=$1 limit 1`, [id]
  );
  return result.rows[0] ?? null;
}
