import { Pool } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const sql1 = fs.readFileSync(
    path.resolve(process.cwd(), "packages/server/src/db/migrations/0000_initial.sql"),
    "utf8"
  );
  const sql2 = fs.readFileSync(
    path.resolve(process.cwd(), "packages/server/src/db/migrations/0001_add_currency_to_expenses.sql"),
    "utf8"
  );

  await pool.query(sql1);
  console.log("✅ Migration 0000 OK");

  await pool.query(sql2);
  console.log("✅ Migration 0001 OK");

  const res = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
  );
  console.log("📋 Tables:", res.rows.map((r: any) => r.table_name).join(", "));

  await pool.end();
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
