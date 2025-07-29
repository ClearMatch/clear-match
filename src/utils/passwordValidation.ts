import { AUTH_CONFIG } from '@/config/auth';

/**
 * Password validation utility
 */
export interface PasswordValidationResult {
  isValid: boolean;
  error: string | null;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const { passwordRequirements } = AUTH_CONFIG;
  
  if (password.length < passwordRequirements.minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${passwordRequirements.minLength} characters long`
    };
  }
  
  if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one uppercase letter'
    };
  }
  
  if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one lowercase letter'
    };
  }
  
  if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number'
    };
  }
  
  if (passwordRequirements.requireSpecialChars && !/\W/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one special character'
    };
  }
  
  return {
    isValid: true,
    error: null
  };
};

export const getPasswordRequirementsText = (): string => {
  const { passwordRequirements } = AUTH_CONFIG;
  return `Must contain at least ${passwordRequirements.minLength} characters with uppercase, lowercase, number, and special character`;
};