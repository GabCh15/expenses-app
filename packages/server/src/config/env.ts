import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// In development, load .env from project root. In production, Fly.io injects env vars.
const envFile = path.resolve(process.cwd(), "../../.env");
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(".env loaded from:", envFile);
} else {
  console.log("No .env file found — using system environment variables (production mode)");
}

const envSchema = z.object({
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_CALLBACK_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
