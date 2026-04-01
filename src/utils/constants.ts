/**
 * Application-wide constants and configuration
 */

// Application Information
export const APP_NAME = 'Clocka';
export const APP_VERSION = '1.0.12';
export const APP_DESCRIPTION = 'School Attendance Management System';

// API Configuration
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY = 1000; // 1 second

// Cache Configuration
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// LocalStorage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'clocka_auth_token',
  USER_DATA: 'clocka_user_data',
  SCHOOL_DATA: 'clocka_school_data',
  OFFLINE_DATA: 'clocka_offline_data',
  THEME: 'clocka_theme',
  LAST_SYNC: 'clocka_last_sync',
  CONNECTION_STATE: 'clocka_connection_state',
} as const;

// User Roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super-admin',
  SCHOOL_ADMIN: 'school-admin',
  PARENT: 'parent',
  ASSIGNEE: 'assignee',
  SECURITY: 'security',
} as const;

// Attendance Types
export const ATTENDANCE_TYPES = {
  CLOCK_IN: 'clock-in',
  CLOCK_OUT: 'clock-out',
} as const;

// Assignee Configuration
export const ASSIGNEE_CONFIG = {
  MAX_DURATION_HOURS: 24,
  MIN_DURATION_HOURS: 1,
  ID_TYPES: ['NIN', 'Drivers License', 'Passport'] as const,
} as const;

// PIN Configuration
export const PIN_CONFIG = {
  LENGTH: 4,
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
} as const;

// Image Configuration
export const IMAGE_CONFIG = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  COMPRESSION_QUALITY: 0.8,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1920,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
  SHORT: 'MM/dd/yyyy',
  TIME_ONLY: 'HH:mm:ss',
} as const;

// Network Configuration
export const NETWORK_CONFIG = {
  ONLINE_POLL_INTERVAL: 30000, // 30 seconds
  OFFLINE_RETRY_INTERVAL: 5000, // 5 seconds
  CONNECTION_TIMEOUT: 10000, // 10 seconds
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  },
  API_CALLS: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
} as const;

// Feature Flags (can be overridden by environment variables)
export const FEATURES = {
  OFFLINE_MODE: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
  ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  PWA: true,
  FACIAL_VERIFICATION: true,
  GPS_TRACKING: true,
  PUSH_NOTIFICATIONS: false, // Not implemented yet
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please login again.',
  PERMISSION_ERROR: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in',
  LOGOUT: 'Successfully logged out',
  CREATE: 'Successfully created',
  UPDATE: 'Successfully updated',
  DELETE: 'Successfully deleted',
  SYNC: 'Data synchronized successfully',
} as const;

// Validation Rules
export const VALIDATION = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
    PATTERN: /^[a-zA-Z\s'-]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    PATTERN: /^[0-9+\-\s()]{10,}$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  SCHOOL_CODE: {
    LENGTH: 6,
    PATTERN: /^[A-Z0-9]{6}$/,
  },
} as const;

// Theme Colors (for programmatic use)
export const THEME_COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  PARENT_LOGIN: '/parent/login',
  PARENT_DASHBOARD: '/parent/dashboard',
  PARENT_REGISTER: '/parent/register',
  SECURITY_DASHBOARD: '/security/dashboard',
  SUPER_ADMIN_LOGIN: '/super-admin/login',
  SUPER_ADMIN_DASHBOARD: '/super-admin/dashboard',
  ASSIGNEE_LOGIN: '/assignee/login',
  ASSIGNEE_DASHBOARD: '/assignee/dashboard',
} as const;

// Export type helpers
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
export type AttendanceType = (typeof ATTENDANCE_TYPES)[keyof typeof ATTENDANCE_TYPES];
export type IdType = (typeof ASSIGNEE_CONFIG.ID_TYPES)[number];
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
