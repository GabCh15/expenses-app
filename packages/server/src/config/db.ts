import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env.js";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = drizzle(pool);

export async function connectDb(): Promise<void> {
  await pool.query("SELECT 1");
  console.log("Database connected");
}
