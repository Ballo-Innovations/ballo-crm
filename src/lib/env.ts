import { z } from "zod";

const blankToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  APP_ENV: z.enum(["local", "dev", "stage", "prod"]).default("local"),
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  // Brutus AI hub: narratives only. Blank key = template fallback.
  BRUTUS_API_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  BRUTUS_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
  INTEGRATION_MODE: z.enum(["mock", "live"]).default("mock"),
  INTEGRATIONS_URL: z.string().url(),
  EMAIL_WEBHOOK_SECRET: z.string().min(1),
  // BalloAds comms API (SMS, email): used only when INTEGRATION_MODE=live
  BALLOADS_API_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
  BALLOADS_API_KEY: z.preprocess(blankToUndefined, z.string().optional()),
  BALLOADS_WEBHOOK_SECRET: z.preprocess(blankToUndefined, z.string().optional()),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validated server environment. Server-only: every variable here is a secret or
 * server-side setting. Mirrors `.env.example` - add new variables to both.
 */
export function getEnv(): Env {
  return envSchema.parse(process.env);
}
