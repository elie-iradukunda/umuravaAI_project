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
  MONGODB_URI: z.preprocess(
    (value) => {
      const normalized = String(value ?? "").trim();
      return normalized || undefined;
    },
    z.string().url().optional()
  ),
  SCREENING_PROVIDER: z.preprocess(
    (value) => {
      const normalized = String(value ?? "")
        .trim()
        .toLowerCase();

      if (!normalized || normalized === "mock") {
        return "gemini";
      }

      return normalized;
    },
    z.enum(["gemini"]).default("gemini")
  ),
  GEMINI_API_KEY: z.preprocess(
    (value) => {
      const normalized = String(value ?? "").trim();
      return normalized || undefined;
    },
    z.string().trim().min(1).optional()
  ),
  GEMINI_SCREENING_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
  GEMINI_DOCUMENT_MODEL: z.string().trim().min(1).default("gemini-2.5-flash"),
});

export const env = envSchema.parse(process.env);
