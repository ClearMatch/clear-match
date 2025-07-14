/**
 * Standardized error handling utilities for TanStack Query mutations
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  name?: string;
}

/**
 * Categories of errors for user-friendly messaging
 */
export enum ErrorCategory {
  NETWORK = 'network',
  PERMISSION = 'permission',
  VALIDATION = 'validation',
  DUPLICATE = 'duplicate',
  NOT_FOUND = 'not_found',
  ORGANIZATION = 'organization',
  DATABASE_CONSTRAINT = 'database_constraint',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * User-friendly error messages by category
 */
const ERROR_MESSAGES: Record<ErrorCategory, string> = {
  [ErrorCategory.NETWORK]: 'Please check your internet connection and try again.',
  [ErrorCategory.PERMISSION]: "You don't have permission to perform this action.",
  [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
  [ErrorCategory.DUPLICATE]: 'This item already exists. Please use a different value.',
  [ErrorCategory.NOT_FOUND]: 'The requested item could not be found.',
  [ErrorCategory.ORGANIZATION]: 'This action is not allowed for your organization. Please contact support if you believe this is an error.',
  [ErrorCategory.DATABASE_CONSTRAINT]: 'This action cannot be completed due to data dependencies. Please check related items and try again.',
  [ErrorCategory.SERVER]: 'Something went wrong on our end. Please try again later.',
  [ErrorCategory.UNKNOWN]: 'Something went wrong. Please try again.',
};

/**
 * Categorize an error based on its properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!error) return ErrorCategory.UNKNOWN;

  const apiError = error as ApiError;

  // Network-related errors
  if (
    apiError.name === 'NetworkError' ||
    apiError.message?.toLowerCase().includes('network') ||
    apiError.message?.toLowerCase().includes('offline') ||
    apiError.message?.toLowerCase().includes('connection')
  ) {
    return ErrorCategory.NETWORK;
  }

  // Permission errors
  if (
    apiError.status === 401 ||
    apiError.status === 403 ||
    apiError.message?.toLowerCase().includes('unauthorized') ||
    apiError.message?.toLowerCase().includes('permission') ||
    apiError.message?.toLowerCase().includes('forbidden')
  ) {
    return ErrorCategory.PERMISSION;
  }

  // Validation errors
  if (
    apiError.status === 400 ||
    apiError.status === 422 ||
    apiError.message?.toLowerCase().includes('validation') ||
    apiError.message?.toLowerCase().includes('invalid') ||
    apiError.message?.toLowerCase().includes('required')
  ) {
    return ErrorCategory.VALIDATION;
  }

  // Duplicate/conflict errors
  if (
    apiError.status === 409 ||
    apiError.message?.toLowerCase().includes('duplicate') ||
    apiError.message?.toLowerCase().includes('already exists') ||
    apiError.message?.toLowerCase().includes('conflict')
  ) {
    return ErrorCategory.DUPLICATE;
  }

  // Not found errors
  if (
    apiError.status === 404 ||
    apiError.message?.toLowerCase().includes('not found') ||
    apiError.message?.toLowerCase().includes('does not exist')
  ) {
    return ErrorCategory.NOT_FOUND;
  }

  // Organization-related errors
  if (
    apiError.message?.toLowerCase().includes('organization') ||
    apiError.message?.toLowerCase().includes('failed to get user organization') ||
    apiError.message?.toLowerCase().includes('authentication required')
  ) {
    return ErrorCategory.ORGANIZATION;
  }

  // Database constraint errors
  if (
    apiError.message?.toLowerCase().includes('foreign key') ||
    apiError.message?.toLowerCase().includes('constraint') ||
    apiError.message?.toLowerCase().includes('references') ||
    apiError.message?.toLowerCase().includes('violates')
  ) {
    return ErrorCategory.DATABASE_CONSTRAINT;
  }

  // Server errors
  if (
    apiError.status && apiError.status >= 500 ||
    apiError.message?.toLowerCase().includes('server error') ||
    apiError.message?.toLowerCase().includes('internal error')
  ) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get a user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown, customMessages?: Partial<Record<ErrorCategory, string>>): string {
  const category = categorizeError(error);
  
  // Use custom message if provided, otherwise fall back to default
  const messages = { ...ERROR_MESSAGES, ...customMessages };
  
  return messages[category] || messages[ErrorCategory.UNKNOWN];
}

/**
 * Enhanced error handler for mutations with context-specific messages
 */
export function createMutationErrorHandler(
  operation: string,
  customMessages?: Partial<Record<ErrorCategory, string>>,
  onError?: (error: unknown, category: ErrorCategory) => void
) {
  return (error: unknown) => {
    const category = categorizeError(error);
    
    // Default operation-specific messages
    const operationMessages: Partial<Record<ErrorCategory, string>> = {
      [ErrorCategory.DUPLICATE]: `This ${operation.toLowerCase()} already exists. Please use different details.`,
      [ErrorCategory.PERMISSION]: `You don't have permission to ${operation.toLowerCase()}.`,
      [ErrorCategory.VALIDATION]: `Please check the ${operation.toLowerCase()} details and try again.`,
      [ErrorCategory.NOT_FOUND]: `The ${operation.toLowerCase()} could not be found.`,
    };

    // Merge messages with priority: custom > operation-specific > default
    const finalMessages = { ...ERROR_MESSAGES, ...operationMessages, ...customMessages };
    
    const userMessage = finalMessages[category] || finalMessages[ErrorCategory.UNKNOWN];

    // Call custom error handler if provided
    if (onError) {
      onError(error, category);
    }

    // Log technical details for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.error(`${operation} Error [${category}]:`, error);
    }

    return userMessage;
  };
}

/**
 * Context-specific error handlers for common operations
 */
export const errorHandlers = {
  contact: {
    create: createMutationErrorHandler('create contact'),
    update: createMutationErrorHandler('update contact'),
    delete: createMutationErrorHandler('delete contact'),
  },
  task: {
    create: createMutationErrorHandler('create task'),
    update: createMutationErrorHandler('update task'),
    delete: createMutationErrorHandler('delete task'),
    updateStatus: createMutationErrorHandler('update task status'),
  },
  event: {
    create: createMutationErrorHandler('create event'),
    update: createMutationErrorHandler('update event'),
    delete: createMutationErrorHandler('delete event'),
  },
};

/**
 * Retry configuration based on error type
 */
export function shouldRetryError(error: unknown, attemptIndex: number): boolean {
  const category = categorizeError(error);
  
  // Don't retry permission, validation, duplicate, not found, organization, or constraint errors
  if ([
    ErrorCategory.PERMISSION,
    ErrorCategory.VALIDATION,
    ErrorCategory.DUPLICATE,
    ErrorCategory.NOT_FOUND,
    ErrorCategory.ORGANIZATION,
    ErrorCategory.DATABASE_CONSTRAINT,
  ].includes(category)) {
    return false;
  }

  // Retry network and server errors up to 3 times
  if ([ErrorCategory.NETWORK, ErrorCategory.SERVER].includes(category)) {
    return attemptIndex < 3;
  }

  // For unknown errors, retry once
  return attemptIndex < 1;
}