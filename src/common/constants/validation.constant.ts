// Validation error messages
export const VALIDATION_MESSAGES = {
  // User validation
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_IN_USE: 'Email already in use by another user',
  INVALID_USER_ID: 'Invalid user ID',

  // Authentication validation
  AUTHORIZATION_TOKEN_REQUIRED: 'Authorization token required',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',

  // Common validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_FORMAT: 'Invalid format provided',
};

// Status values
export const USER_STATUS_VALUES = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// Authentication constants
export const AUTH_CONSTANTS = {
  BEARER_PREFIX: 'Bearer ',
  UNKNOWN_REQUEST_ID: 'unknown',
} as const;

// API path constants
export const API_PATHS = {
  BASE: 'api/v1',
  USERS: 'api/v1/users',
} as const;
