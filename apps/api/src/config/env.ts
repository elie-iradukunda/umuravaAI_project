import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";
import { z } from "zod";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFilePath);
const apiEnvPath = path.resolve(currentDirectory, "../../.env");

dotenv.config({ path: apiEnvPath });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().url().optional(),
  SCREENING_PROVIDER: z.enum(["mock", "gemini"]).default("mock"),
  AUTO_SEED_DEMO: z
    .union([z.literal("true"), z.literal("false")])
    .default("true")
    .transform((value) => value === "true"),
});

export const env = envSchema.parse(process.env);
