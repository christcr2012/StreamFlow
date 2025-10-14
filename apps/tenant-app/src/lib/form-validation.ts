/**
 * Form Validation Utilities
 * 
 * Provides comprehensive validation functions with user-friendly error messages
 */

export interface ValidationRule {
  validate: (value: any) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common validation rules
 */
export const validators = {
  required: (fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== '';
    },
    message: `${fieldName} is required`,
  }),

  email: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true; // Allow empty (use required separately)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: 'Please enter a valid email address',
  }),

  phone: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      // Allow various phone formats
      const phoneRegex = /^[\d\s\-\(\)\+]+$/;
      const digitsOnly = value.replace(/\D/g, '');
      return phoneRegex.test(value) && digitsOnly.length >= 10;
    },
    message: 'Please enter a valid phone number (at least 10 digits)',
  }),

  minLength: (min: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return value.length >= min;
    },
    message: `${fieldName} must be at least ${min} characters`,
  }),

  maxLength: (max: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return value.length <= max;
    },
    message: `${fieldName} must be no more than ${max} characters`,
  }),

  min: (min: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value >= min;
    },
    message: `${fieldName} must be at least ${min}`,
  }),

  max: (max: number, fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value <= max;
    },
    message: `${fieldName} must be no more than ${max}`,
  }),

  positive: (fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return value > 0;
    },
    message: `${fieldName} must be a positive number`,
  }),

  integer: (fieldName: string = 'This field'): ValidationRule => ({
    validate: (value: number) => {
      if (value === null || value === undefined) return true;
      return Number.isInteger(value);
    },
    message: `${fieldName} must be a whole number`,
  }),

  url: (): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'Please enter a valid URL',
  }),

  date: (): ValidationRule => ({
    validate: (value: string | Date) => {
      if (!value) return true;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message: 'Please enter a valid date',
  }),

  futureDate: (fieldName: string = 'This date'): ValidationRule => ({
    validate: (value: string | Date) => {
      if (!value) return true;
      const date = new Date(value);
      return date > new Date();
    },
    message: `${fieldName} must be in the future`,
  }),

  pastDate: (fieldName: string = 'This date'): ValidationRule => ({
    validate: (value: string | Date) => {
      if (!value) return true;
      const date = new Date(value);
      return date < new Date();
    },
    message: `${fieldName} must be in the past`,
  }),

  match: (otherValue: any, otherFieldName: string): ValidationRule => ({
    validate: (value: any) => {
      return value === otherValue;
    },
    message: `Must match ${otherFieldName}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message,
  }),

  custom: (
    validateFn: (value: any) => boolean,
    message: string
  ): ValidationRule => ({
    validate: validateFn,
    message,
  }),
};

/**
 * Validate a single field against multiple rules
 */
export function validateField(
  value: any,
  rules: ValidationRule[]
): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple fields
 */
export function validateForm(
  values: Record<string, any>,
  rules: Record<string, ValidationRule[]>
): Record<string, ValidationResult> {
  const results: Record<string, ValidationResult> = {};

  for (const [field, fieldRules] of Object.entries(rules)) {
    results[field] = validateField(values[field], fieldRules);
  }

  return results;
}

/**
 * Check if form validation results are all valid
 */
export function isFormValid(
  results: Record<string, ValidationResult>
): boolean {
  return Object.values(results).every(result => result.isValid);
}

/**
 * Get all error messages from validation results
 */
export function getFormErrors(
  results: Record<string, ValidationResult>
): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const [field, result] of Object.entries(results)) {
    if (!result.isValid) {
      errors[field] = result.errors;
    }
  }

  return errors;
}

/**
 * Get first error message for each field
 */
export function getFirstErrors(
  results: Record<string, ValidationResult>
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, result] of Object.entries(results)) {
    if (!result.isValid && result.errors.length > 0) {
      errors[field] = result.errors[0];
    }
  }

  return errors;
}

/**
 * Example usage:
 * 
 * const formRules = {
 *   email: [
 *     validators.required('Email'),
 *     validators.email(),
 *   ],
 *   password: [
 *     validators.required('Password'),
 *     validators.minLength(8, 'Password'),
 *   ],
 *   confirmPassword: [
 *     validators.required('Confirm Password'),
 *     validators.match(formData.password, 'Password'),
 *   ],
 * };
 * 
 * const results = validateForm(formData, formRules);
 * if (isFormValid(results)) {
 *   // Submit form
 * } else {
 *   const errors = getFirstErrors(results);
 *   // Display errors
 * }
 */

