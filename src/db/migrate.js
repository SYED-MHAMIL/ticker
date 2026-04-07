import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationTable() {
  const sql = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run_on TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  await db.query(sql);
}

async function getAppliedMigrations() {
  const { rows } = await db.query("SELECT name FROM migrations ORDER BY id");
  return rows.map((row) => row.name);
}

async function runMigrationFile(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, "utf8");
  console.log("Applying migration:", filename);

  await db.query("BEGIN");
  try {
    await db.query(sql);
    await db.query("INSERT INTO migrations (name) VALUES ($1)", [filename]);
    await db.query("COMMIT");
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  }
}

async function runMigrations() {
  await ensureMigrationTable();

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const applied = new Set(await getAppliedMigrations());

  for (const file of files) {
    if (applied.has(file)) {
      console.log("Skipping already applied migration:", file);
      continue;
    }
    await runMigrationFile(file);
  }

  console.log("All pending migrations have been applied.");
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
