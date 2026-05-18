import { pool } from "./pool.js";

async function runMigrations() {
  console.log("Wykonywanie migracji bazy danych...");

  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pl';
      ALTER TABLE characters ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'pl';
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
    `);
    console.log("Migracje zakończone sukcesem! Dodano brakujące kolumny.");
  } catch (error) {
    console.error("Błąd podczas migracji:", error);
  } finally {
    await pool.end();
  }
}

runMigrations();
