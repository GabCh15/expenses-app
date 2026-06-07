import { z } from "zod";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root (two levels up from packages/server)
const envPath = path.resolve(process.cwd(), "../../.env");
const result = dotenv.config({ path: envPath });
console.log("Loading .env from:", envPath);
console.log(".env loaded:", !result.error, result.error ? result.error.message : "");

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional().default("http://localhost:5173"),
  TZ: z.string().default("America/Bogota"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
