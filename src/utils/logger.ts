import { config } from '../config/config';

// Log levels for environment-based control
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Get current log level from environment
const getLogLevel = (): LogLevel => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  switch (envLevel) {
    case 'ERROR':
      return LogLevel.ERROR;
    case 'WARN':
      return LogLevel.WARN;
    case 'INFO':
      return LogLevel.INFO;
    case 'DEBUG':
      return LogLevel.DEBUG;
    default:
      return config.nodeEnv === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
};

const currentLogLevel = getLogLevel();

// Structured log interface
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  userId?: string;
  service?: string;
  environment?: string;
  method?: string;
  url?: string;
  duration?: number;
  statusCode?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

// Helper to create structured log entry
const createLogEntry = (
  level: string,
  message: string,
  metadata?: Record<string, any>,
): LogEntry => ({
  timestamp: new Date().toISOString(),
  level,
  message,
  service: 'nestjs-auth-api',
  environment: config.nodeEnv,
  ...metadata,
});

// Helper to format log output
const formatLog = (entry: LogEntry): string => {
  if (config.nodeEnv === 'production') {
    // JSON format for production (easier to parse by log aggregators)
    return JSON.stringify(entry);
  } else {
    // Human-readable format for development
    const { timestamp, level, message, requestId, userId, duration, statusCode, error } = entry;
    let formatted = `[${timestamp}] [${level}] ${message}`;

    if (requestId) formatted += ` [RequestID: ${requestId}]`;
    if (userId) formatted += ` [UserID: ${userId}]`;
    if (duration) formatted += ` [Duration: ${duration}ms]`;
    if (statusCode) formatted += ` [Status: ${statusCode}]`;
    if (error) formatted += ` [Error: ${error.name}: ${error.message}]`;

    return formatted;
  }
};

// Sanitize sensitive data from logs
const sanitizeData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;

  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
};

// Main logging functions
export function logError(message: string, error?: Error, metadata?: Record<string, any>) {
  if (currentLogLevel >= LogLevel.ERROR) {
    const logEntry = createLogEntry('ERROR', message, {
      ...sanitizeData(metadata),
      error: error
        ? {
          name: error.name,
          message: error.message,
          stack: config.nodeEnv === 'development' ? error.stack : undefined,
          code: (error as any).code,
        }
        : undefined,
    });

    console.error(formatLog(logEntry));
  }
}

export function logInfoMessage(message: string, metadata?: Record<string, any>) {
  if (currentLogLevel >= LogLevel.INFO) {
    const logEntry = createLogEntry('INFO', message, sanitizeData(metadata));
    console.log(formatLog(logEntry));
  }
}

export function logWarning(message: string, metadata?: Record<string, any>) {
  if (currentLogLevel >= LogLevel.WARN) {
    const logEntry = createLogEntry('WARN', message, sanitizeData(metadata));
    console.warn(formatLog(logEntry));
  }
}

export function logDebug(message: string, metadata?: Record<string, any>) {
  if (currentLogLevel >= LogLevel.DEBUG) {
    const logEntry = createLogEntry('DEBUG', message, sanitizeData(metadata));
    console.debug(formatLog(logEntry));
  }
}

// Specialized logging functions for common use cases
export function logRequest(req: any, metadata?: Record<string, any>) {
  logInfoMessage('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    ...metadata,
  });
}

export function logResponse(req: any, res: any, duration: number, metadata?: Record<string, any>) {
  logInfoMessage('Request completed', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration,
    contentLength: res.get('Content-Length'),
    userId: req.user?.id,
    ...metadata,
  });
}

export function logDatabaseQuery(query: string, params: any, duration: number) {
  logDebug('Database query executed', {
    query: query.replace(/\s+/g, ' ').trim(),
    params: sanitizeData(params),
    duration,
  });
}

export function logSecurityEvent(event: string, userId?: string, metadata?: Record<string, any>) {
  logWarning(`Security event: ${event}`, {
    userId,
    ...sanitizeData(metadata),
  });
}

export function logBusinessEvent(event: string, userId?: string, metadata?: Record<string, any>) {
  logInfoMessage(`Business event: ${event}`, {
    userId,
    ...sanitizeData(metadata),
  });
}
