import 'dotenv/config';

// Time constants
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;
const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_DAY
  = HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;

// Default values
const DEFAULT_APP_PORT = 3000;
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = 'localhost';
const DEFAULT_PAGINATION_LIMIT = 10;
const DEFAULT_MAX_PAGINATION_LIMIT = 100;
const DEFAULT_PAGE_NUMBER = 1;

// Security constants
const DEFAULT_BCRYPT_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;
const MIN_NAME_LENGTH = 2;
const DEFAULT_RANDOM_STRING_LENGTH = 32;
const BEARER_TOKEN_PREFIX_LENGTH = 7; // "Bearer ".length

// Time-based constants
const PAYMENT_STATUS_CHECKER_TTL_MINUTES = 30;
const PAYMENT_STATUS_CHECKER_REPEAT_INTERVAL_MINUTES = 2;

// Fee constants
const MIN_FEE_RANGE_1 = 0;
const MAX_FEE_RANGE_1 = 100;
const FEE_RATE_1_PAYMENT = 2.5;
const FEE_RATE_1_DISBURSEMENT = 1.5;

const MIN_FEE_RANGE_2 = 100;
const MAX_FEE_RANGE_2 = 1000;
const FEE_RATE_2_PAYMENT = 3.0;
const FEE_RATE_2_DISBURSEMENT = 2.0;

export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL!,

  // Authentication & Security
  authJWTSecret: process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET!,
  authRefreshJWTSecret: process.env.AUTH_REFRESH_JWT_SECRET || process.env.JWT_SECRET!,
  tokenExpiration: process.env.TOKEN_EXPIRATION || '15m',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  tokenExpirationInSeconds: 15 * SECONDS_IN_MINUTE, // 15 minutes for access tokens
  refreshTokenExpirationInSeconds: (7 * MILLISECONDS_IN_DAY) / MILLISECONDS_IN_SECOND, // 7 days for refresh tokens
  bcryptSaltRounds: DEFAULT_BCRYPT_SALT_ROUNDS,
  bearerTokenPrefixLength: BEARER_TOKEN_PREFIX_LENGTH,

  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    },
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authUrl: process.env.GITHUB_AUTH_URL || 'https://github.com/login/oauth/authorize',
      tokenUrl: process.env.GITHUB_TOKEN_URL || 'https://github.com/login/oauth/access_token',
    },
    redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/api/v1/auth/callback',
  },

  // Email Configuration (SMTP)
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: process.env.SMTP_FROM_EMAIL || 'noreply@yourapp.com',
    fromName: process.env.SMTP_FROM_NAME || 'ByteInbox',
  },

  // SMS Configuration (Twilio)
  sms: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },

  // MFA Configuration
  mfa: {
    issuer: process.env.MFA_ISSUER || 'ByteInbox', // TOTP issuer name for authenticator apps
    otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '5'),
    otpLength: parseInt(process.env.OTP_LENGTH || '6'),
    totpWindow: parseInt(process.env.TOTP_WINDOW || '2'),
    maxOtpAttempts: parseInt(process.env.MAX_OTP_ATTEMPTS || '3'),
    rateLimit: {
      emailOtpLimit: parseInt(process.env.EMAIL_OTP_RATE_LIMIT || '5'),
      windowMinutes: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MINUTES || '15'),
    },
  },

  // Validation Rules
  validation: {
    password: {
      minLength: MIN_PASSWORD_LENGTH,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      patternMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
    name: {
      minLength: MIN_NAME_LENGTH,
    },
    pagination: {
      defaultLimit: DEFAULT_PAGINATION_LIMIT,
      maxLimit: DEFAULT_MAX_PAGINATION_LIMIT,
      defaultPage: DEFAULT_PAGE_NUMBER,
    },
    randomString: {
      defaultLength: DEFAULT_RANDOM_STRING_LENGTH,
    },
  },

  // External Microservices
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL!,
  mfaServiceUrl: process.env.MFA_SERVICE_URL!,
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL!,

  // Queue Configuration (Redis)
  redis: {
    host: process.env.REDIS_HOST || DEFAULT_REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || DEFAULT_REDIS_PORT.toString()),
    url: process.env.REDIS_URL!,
  },
  paymentStatusCheckerTTL:
    PAYMENT_STATUS_CHECKER_TTL_MINUTES * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND, // 30 minutes
  paymentStatusCheckerRepeatInterval:
    PAYMENT_STATUS_CHECKER_REPEAT_INTERVAL_MINUTES * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND, // 2 minutes

  // Business Logic
  defaultAccountCurrency: 'USD',
  cashCoWalletAccountTypeName: 'CashCo Wallet',
  fiatWalletCryptoTokenId: process.env.FIAT_WALLET_CRYPTO_TOKEN_ID!,
  cashCoWalletCryptoTokenId: process.env.CASHCO_WALLET_CRYPTO_TOKEN_ID!,

  // Fee Configuration
  fees: {
    paymentFees: [
      { min: MIN_FEE_RANGE_1, max: MAX_FEE_RANGE_1, fee: FEE_RATE_1_PAYMENT },
      { min: MIN_FEE_RANGE_2, max: MAX_FEE_RANGE_2, fee: FEE_RATE_2_PAYMENT },
    ],
    disbursementFees: [
      { min: MIN_FEE_RANGE_1, max: MAX_FEE_RANGE_1, fee: FEE_RATE_1_DISBURSEMENT },
      { min: MIN_FEE_RANGE_2, max: MAX_FEE_RANGE_2, fee: FEE_RATE_2_DISBURSEMENT },
    ],
  },

  // Webhook Events
  webhookEventTypes: {
    paymentInitiated: 'payment.initiated',
    paymentCompleted: 'payment.completed',
    paymentFailed: 'payment.failed',
    disbursementInitiated: 'disbursement.initiated',
    disbursementCompleted: 'disbursement.completed',
  },

  // Application
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || DEFAULT_APP_PORT.toString()),

  // Joi Validation Options
  joiOptions: {
    errors: {
      wrap: { label: '' },
    },
    abortEarly: true,
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG'),
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false',
    enableDatabaseLogging: process.env.ENABLE_DATABASE_LOGGING !== 'false',
    enableSecurityLogging: process.env.ENABLE_SECURITY_LOGGING !== 'false',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    ses: {
      defaultRegion: process.env.AWS_SES_REGION || process.env.AWS_REGION || 'us-east-1',
      dkimSelector: 'byteinbox', // Fixed selector for all domains
      dkimPublicKey: process.env.AWS_DKIM_PUBLIC_KEY!, // Base64 encoded public key (required)
      dkimPrivateKey: process.env.AWS_DKIM_PRIVATE_KEY!, // Base64 encoded private key (required)
    },
  },
};
