// src/lib/environment.ts

/**
 * 🎯 STREAMFLOW ENVIRONMENT CONFIGURATION
 * 
 * Smart environment detection that matches real-world development needs:
 * 
 * DEVELOPMENT: Local development with loose security, debug logging
 * STAGING: Production-quality system for testing, evaluation, demos
 * PRODUCTION: Live client-serving system with maximum security
 * 
 * This solves the common problem where you need "production quality"
 * without "production restrictions" during development phases.
 */

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  type: EnvironmentType;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  isClientProduction: boolean; // True production serving real clients
  allowDevUsers: boolean;
  allowDebugLogging: boolean;
  requireStrictSecurity: boolean;
  allowTestData: boolean;
}

/**
 * Detect current environment with smart defaults
 */
export function detectEnvironment(): EnvironmentConfig {
  // Vercel environment detection
  const vercelEnv = process.env.VERCEL_ENV; // 'development', 'preview', 'production'
  const nodeEnv = process.env.NODE_ENV; // 'development', 'production'
  
  // Manual override for client production
  const isClientProduction = process.env.DISABLE_DEV_USERS === 'true';
  
  // Determine environment type
  let type: EnvironmentType;
  
  if (nodeEnv === 'development' || vercelEnv === 'development') {
    type = 'development';
  } else if (isClientProduction) {
    type = 'production';
  } else {
    // Default to staging for Vercel preview/production without client flag
    type = 'staging';
  }
  
  // Build configuration
  const config: EnvironmentConfig = {
    type,
    isDevelopment: type === 'development',
    isStaging: type === 'staging',
    isProduction: type === 'production',
    isClientProduction,
    
    // Feature flags based on environment
    allowDevUsers: type !== 'production',
    allowDebugLogging: type !== 'production',
    requireStrictSecurity: type === 'production',
    allowTestData: type !== 'production',
  };
  
  return config;
}

/**
 * Global environment configuration
 */
export const ENV = detectEnvironment();

/**
 * Environment-specific logging
 */
export function envLog(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  if (level === 'debug' && !ENV.allowDebugLogging) return;
  
  const prefix = `[${ENV.type.toUpperCase()}]`;
  
  switch (level) {
    case 'debug':
      console.debug(prefix, message, data);
      break;
    case 'info':
      console.info(prefix, message, data);
      break;
    case 'warn':
      console.warn(prefix, message, data);
      break;
    case 'error':
      console.error(prefix, message, data);
      break;
  }
}

/**
 * Environment status for debugging
 */
export function getEnvironmentStatus() {
  return {
    ...ENV,
    vercelEnv: process.env.VERCEL_ENV,
    nodeEnv: process.env.NODE_ENV,
    disableDevUsers: process.env.DISABLE_DEV_USERS,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validate environment configuration
 */
export function validateEnvironment(): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  if (ENV.isProduction && ENV.allowDevUsers) {
    warnings.push('Dev users are enabled in production environment');
  }
  
  if (ENV.isStaging && !process.env.DATABASE_URL) {
    warnings.push('DATABASE_URL not set in staging environment');
  }
  
  if (ENV.allowTestData && !process.env.DEV_OWNER_EMAIL) {
    warnings.push('DEV_OWNER_EMAIL not set but test data is allowed');
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}
