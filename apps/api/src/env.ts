import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(24),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_SITE_URL: z.string().default("http://localhost:3000"),
  OPENROUTER_APP_NAME: z.string().default("Aether Roleplay"),
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default("http://localhost:3000")
});

export const env = EnvSchema.parse(process.env);
