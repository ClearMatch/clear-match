/**
 * Authentication configuration constants
 */

export const AUTH_CONFIG = {
  resetRedirectUrl: process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`
    : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/reset-password/confirm`,
  redirectDelay: 2000,
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  }
} as const;