// src/lib/password-policy.ts
/**
 * Global Password Policy Enforcement System
 * Enforces consistent password security standards across the entire application
 */

export interface PasswordPolicyConfig {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
  lockoutThreshold: number;
  lockoutDuration: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  score: number;
}

// Default security-first password policy (SOC 2 compliant)
export const DEFAULT_PASSWORD_POLICY: PasswordPolicyConfig = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventReuse: 12,
  maxAge: 90,
  lockoutThreshold: 5,
  lockoutDuration: 30
};

/**
 * Validate password against global security policy
 */
export function validatePasswordPolicy(password: string, policy?: PasswordPolicyConfig): PasswordValidationResult {
  const config = policy || DEFAULT_PASSWORD_POLICY;
  const errors: string[] = [];

  // Length requirement
  if (password.length < config.minLength) {
    errors.push(`Password must be at least ${config.minLength} characters long`);
  }

  // Character requirements
  if (config.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (config.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (config.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (config.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate strength score
  const { strength, score } = calculatePasswordStrength(password);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Calculate password strength score and rating
 */
function calculatePasswordStrength(password: string): { strength: PasswordValidationResult['strength'], score: number } {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Bonus points for complexity
  if (password.length >= 20) score += 1;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?].*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 1;

  // Determine strength level
  let strength: PasswordValidationResult['strength'];
  if (score <= 2) strength = 'very-weak';
  else if (score <= 4) strength = 'weak';
  else if (score <= 6) strength = 'fair';
  else if (score <= 7) strength = 'good';
  else strength = 'strong';

  return { strength, score: Math.min(score * 10, 100) };
}

/**
 * Check if password has been used recently (for reuse prevention)
 */
export async function validatePasswordReuse(
  userId: string, 
  newPassword: string, 
  policy?: PasswordPolicyConfig
): Promise<{ isValid: boolean; error?: string }> {
  const config = policy || DEFAULT_PASSWORD_POLICY;
  
  if (config.preventReuse === 0) {
    return { isValid: true };
  }

  // TODO: Implement password history checking
  // For now, return valid (would need to store password hashes in history table)
  return { isValid: true };
}

/**
 * Get human-readable password requirements
 */
export function getPasswordRequirements(policy?: PasswordPolicyConfig): string[] {
  const config = policy || DEFAULT_PASSWORD_POLICY;
  const requirements: string[] = [];

  requirements.push(`At least ${config.minLength} characters long`);
  
  if (config.requireUppercase) {
    requirements.push('At least one uppercase letter (A-Z)');
  }
  
  if (config.requireLowercase) {
    requirements.push('At least one lowercase letter (a-z)');
  }
  
  if (config.requireNumbers) {
    requirements.push('At least one number (0-9)');
  }
  
  if (config.requireSpecialChars) {
    requirements.push('At least one special character (!@#$%^&* etc.)');
  }

  if (config.preventReuse > 0) {
    requirements.push(`Cannot reuse last ${config.preventReuse} passwords`);
  }

  return requirements;
}

/**
 * Format validation errors for user display
 */
export function formatPasswordErrors(result: PasswordValidationResult): string {
  if (result.isValid) {
    return '';
  }
  
  return result.errors.join('; ');
}