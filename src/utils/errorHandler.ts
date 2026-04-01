/**
 * Centralized error handling utility
 * Provides consistent error handling across the application
 */

import { logger } from './logger';
import { ERROR_MESSAGES } from './constants';

export enum ErrorType {
  NETWORK = 'NetworkError',
  AUTH = 'AuthError',
  VALIDATION = 'ValidationError',
  PERMISSION = 'PermissionError',
  NOT_FOUND = 'NotFoundError',
  SERVER = 'ServerError',
  TIMEOUT = 'TimeoutError',
  UNKNOWN = 'UnknownError',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp: Date;
}

/**
 * Create a standardized application error
 */
export function createError(
  type: ErrorType,
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): AppError {
  return {
    type,
    message,
    originalError,
    context,
    timestamp: new Date(),
  };
}

/**
 * Parse error from various sources into AppError
 */
export function parseError(error: unknown, context?: Record<string, any>): AppError {
  // Handle AppError
  if (isAppError(error)) {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return classifyError(error, context);
  }

  // Handle HTTP response errors
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const httpError = error as { status: number; statusText?: string };
    return createError(
      getErrorTypeFromStatus(httpError.status),
      httpError.statusText || 'Request failed',
      undefined,
      context
    );
  }

  // Handle string errors
  if (typeof error === 'string') {
    return createError(ErrorType.UNKNOWN, error, undefined, context);
  }

  // Unknown error type
  return createError(
    ErrorType.UNKNOWN,
    'An unexpected error occurred',
    undefined,
    context
  );
}

/**
 * Check if error is an AppError
 */
function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    'message' in error &&
    'timestamp' in error
  );
}

/**
 * Classify Error object into ErrorType
 */
function classifyError(error: Error, context?: Record<string, any>): AppError {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return createError(ErrorType.NETWORK, ERROR_MESSAGES.NETWORK_ERROR, error, context);
  }

  if (message.includes('auth') || message.includes('unauthorized')) {
    return createError(ErrorType.AUTH, ERROR_MESSAGES.AUTH_ERROR, error, context);
  }

  if (message.includes('permission') || message.includes('forbidden')) {
    return createError(ErrorType.PERMISSION, ERROR_MESSAGES.PERMISSION_ERROR, error, context);
  }

  if (message.includes('not found') || message.includes('404')) {
    return createError(ErrorType.NOT_FOUND, ERROR_MESSAGES.NOT_FOUND, error, context);
  }

  if (message.includes('timeout')) {
    return createError(ErrorType.TIMEOUT, ERROR_MESSAGES.TIMEOUT_ERROR, error, context);
  }

  if (message.includes('validation') || message.includes('invalid')) {
    return createError(ErrorType.VALIDATION, ERROR_MESSAGES.VALIDATION_ERROR, error, context);
  }

  // Default to server error
  return createError(ErrorType.SERVER, error.message || ERROR_MESSAGES.SERVER_ERROR, error, context);
}

/**
 * Get ErrorType from HTTP status code
 */
function getErrorTypeFromStatus(status: number): ErrorType {
  if (status === 401 || status === 403) {
    return ErrorType.AUTH;
  }

  if (status === 404) {
    return ErrorType.NOT_FOUND;
  }

  if (status === 400 || status === 422) {
    return ErrorType.VALIDATION;
  }

  if (status === 408) {
    return ErrorType.TIMEOUT;
  }

  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  // Use custom message if available
  if (error.message && !error.message.startsWith('[')) {
    return error.message;
  }

  // Otherwise use default message for error type
  switch (error.type) {
    case ErrorType.NETWORK:
      return ERROR_MESSAGES.NETWORK_ERROR;
    case ErrorType.AUTH:
      return ERROR_MESSAGES.AUTH_ERROR;
    case ErrorType.PERMISSION:
      return ERROR_MESSAGES.PERMISSION_ERROR;
    case ErrorType.NOT_FOUND:
      return ERROR_MESSAGES.NOT_FOUND;
    case ErrorType.VALIDATION:
      return ERROR_MESSAGES.VALIDATION_ERROR;
    case ErrorType.TIMEOUT:
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    case ErrorType.SERVER:
      return ERROR_MESSAGES.SERVER_ERROR;
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Handle error with logging and optional callback
 */
export function handleError(
  error: unknown,
  context?: Record<string, any>,
  onError?: (appError: AppError) => void
): AppError {
  const appError = parseError(error, context);

  // Log error
  logger.error('Error occurred:', {
    type: appError.type,
    message: appError.message,
    context: appError.context,
    originalError: appError.originalError,
  });

  // Call optional error callback
  if (onError) {
    try {
      onError(appError);
    } catch (callbackError) {
      logger.error('Error in error callback:', callbackError);
    }
  }

  return appError;
}

/**
 * Async error handler wrapper
 */
export function asyncErrorHandler<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>,
  onError?: (error: AppError) => void
): Promise<T> {
  return fn().catch((error) => {
    const appError = handleError(error, context, onError);
    throw appError;
  });
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000,
  context?: Record<string, any>
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const appError = parseError(error, context);

      // Don't retry on validation or auth errors
      if (
        appError.type === ErrorType.VALIDATION ||
        appError.type === ErrorType.AUTH ||
        appError.type === ErrorType.PERMISSION
      ) {
        throw appError;
      }

      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, i);
      logger.warn(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms`);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // All retries failed
  throw handleError(lastError, { ...context, retriesExhausted: true });
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AppError): boolean {
  return (
    error.type === ErrorType.NETWORK ||
    error.type === ErrorType.TIMEOUT ||
    error.type === ErrorType.SERVER
  );
}

/**
 * Error boundary helper for React components
 */
export function getErrorBoundaryFallback(error: Error): React.ReactNode {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 text-center">
          Something went wrong
        </h3>
        <p className="mt-2 text-sm text-gray-500 text-center">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}
