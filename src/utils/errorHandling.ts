/**
 * Error handling utilities for authentication
 */

export const getAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Map specific Supabase error messages to user-friendly messages
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid_credentials') || message.includes('invalid login')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (message.includes('email_not_confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    
    if (message.includes('too_many_requests') || message.includes('rate_limit')) {
      return 'Too many requests. Please wait a moment before trying again.';
    }
    
    if (message.includes('invalid_token') || message.includes('expired')) {
      return 'Invalid or expired reset link. Please request a new password reset.';
    }
    
    if (message.includes('weak_password')) {
      return 'Password is too weak. Please choose a stronger password.';
    }
    
    if (message.includes('email_change_required')) {
      return 'Email change is required. Please check your email.';
    }
    
    // Return the original message for other known errors
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return message.includes('network') || 
           message.includes('fetch') || 
           message.includes('connection') ||
           message.includes('timeout');
  }
  return false;
};

export const logError = (context: string, error: unknown): void => {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
  
  // In production, you would send to your logging service
  // Example: logToService(context, error);
};