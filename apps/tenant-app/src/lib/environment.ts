import { z } from "zod";

// Zod-based environment validation for tenant-app
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),

  // NextAuth (if used)
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),

  // Public app URL
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),

  // Feature flags
  ENABLE_AI_FEATURES: z.enum(["true", "false"]).optional(),
  ENABLE_SMS: z.enum(["true", "false"]).optional(),
  ENABLE_PAYMENTS: z.enum(["true", "false"]).optional(),
});

export type Env = z.infer<typeof envSchema>;
export const env: Env = envSchema.parse(process.env);

export const ENV = {
  nodeEnv: env.NODE_ENV,
  isDevelopment: env.NODE_ENV !== "production",
  isProduction: env.NODE_ENV === "production",
};

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
