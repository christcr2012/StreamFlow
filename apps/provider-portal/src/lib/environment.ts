import { z } from "zod";

// Zod-based environment validation
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  // Auth/session
  SESSION_SECRET: z.string().min(16),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Feature flags
  DISABLE_DEV_USERS: z.string().optional(),
  ENABLE_AI_FEATURES: z.enum(["true", "false"]).optional(),
  ENABLE_SMS: z.enum(["true", "false"]).optional(),
  ENABLE_PAYMENTS: z.enum(["true", "false"]).optional(),

  // External services (optional by default, validated at use-sites)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);

export const ENV = {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV !== "production",
  isStaging: env.VERCEL_ENV === "preview",
  isProduction: env.NODE_ENV === "production",
  allowDevUsers: env.DISABLE_DEV_USERS !== "true",
};

export function getEnvironmentStatus() {
  return {
    nodeEnv: ENV.nodeEnv,
    isDevelopment: ENV.isDevelopment,
    isStaging: ENV.isStaging,
    isProduction: ENV.isProduction,
    allowDevUsers: ENV.allowDevUsers,
  };
}

export function validateEnvironment() {
  try {
    envSchema.parse(process.env);
    return { valid: true, warnings: [] as string[] };
  } catch (e: any) {
    const issues = e?.issues?.map(
      (i: any) => `${i.path.join(".")}: ${i.message}`,
    ) ?? ["Unknown error"];
    return { valid: false, warnings: issues };
  }
}
