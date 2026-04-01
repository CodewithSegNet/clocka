/**
 * Production-safe logger utility
 * Logs to console in development, silent in production
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  error: (...args: any[]) => {
    // Always log errors, even in production
    console.error(...args);
    
    // TODO: Send to error tracking service in production
    if (!isDev) {
      // Example: Sentry.captureException(args[0]);
    }
  },

  debug: (...args: any[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  table: (data: any) => {
    if (isDev) {
      console.table(data);
    }
  },

  group: (label: string) => {
    if (isDev) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDev) {
      console.groupEnd();
    }
  }
};

// Export individual functions for convenience
export const { log, info, warn, error, debug } = logger;
