// Time-related constants following the style guide patterns

// Basic time units
export const SECONDS_IN_MINUTE = 60;
export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const DAYS_IN_WEEK = 7;
export const DAYS_IN_MONTH = 30;
export const DAYS_IN_YEAR = 365;

// Millisecond conversions
export const MILLISECONDS_IN_SECOND = 1000;
export const MILLISECONDS_IN_MINUTE = SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;
export const MILLISECONDS_IN_HOUR = MINUTES_IN_HOUR * MILLISECONDS_IN_MINUTE;
export const MILLISECONDS_IN_DAY = HOURS_IN_DAY * MILLISECONDS_IN_HOUR;

// Authentication and security constants
export const MIN_PASSWORD_LENGTH = 6;
export const JWT_ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const JWT_REFRESH_TOKEN_EXPIRY_DAYS = 7;
export const PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = 30;
export const EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

// JWT time format constants (for JWT library compatibility)
export const JWT_ACCESS_TOKEN_EXPIRY_FORMAT = `${JWT_ACCESS_TOKEN_EXPIRY_MINUTES}m`;
export const JWT_REFRESH_TOKEN_EXPIRY_FORMAT = `${JWT_REFRESH_TOKEN_EXPIRY_DAYS}d`;

// MFA (Multi-Factor Authentication) constants
export const OTP_EXPIRY_MINUTES = 5;
export const OTP_LENGTH = 6;
export const TOTP_WINDOW = 2; // Allow 2 time steps for clock drift
export const MFA_SETUP_TOKEN_EXPIRY_MINUTES = 10;
export const MAX_OTP_ATTEMPTS = 3;
export const OTP_RATE_LIMIT_WINDOW_MINUTES = 15;
export const EMAIL_OTP_RATE_LIMIT = 5; // Max 5 email OTPs per window
export const SMS_OTP_RATE_LIMIT = 3; // Max 3 SMS OTPs per window (more expensive)
export const AUTH_OTP_EXPIRY_MINUTES = 10; // OTP expiry for auth helper functions

// Session and token constants
export const MAX_ACTIVE_SESSIONS = 5;
export const SESSION_CLEANUP_INTERVAL_HOURS = 24;
export const REFRESH_TOKEN_CLEANUP_INTERVAL_HOURS = 24;
export const TOKEN_LENGTH = 32; // Length for verification and reset tokens
export const REFRESH_TOKEN_LENGTH = 64; // Length for refresh tokens

// Account lockout constants
export const MAX_LOGIN_ATTEMPTS = 5;
export const ACCOUNT_LOCKOUT_DURATION_MINUTES = 30;
export const LOGIN_ATTEMPT_WINDOW_MINUTES = 15;

// Rate limiting constants
export const API_RATE_LIMIT_WINDOW_MINUTES = 15;
export const API_RATE_LIMIT_MAX_REQUESTS = 100;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 10;
export const REGISTRATION_RATE_LIMIT_MAX_ATTEMPTS = 3;

// Cache expiry constants
export const CACHE_TTL_SHORT_MINUTES = 5;
export const CACHE_TTL_MEDIUM_MINUTES = 30;
export const CACHE_TTL_LONG_HOURS = 24;

// Background job intervals
export const TOKEN_CLEANUP_INTERVAL_HOURS = 6;
export const USER_ACTIVITY_LOG_INTERVAL_HOURS = 24;
export const SECURITY_AUDIT_INTERVAL_HOURS = 12;
