# Production Logging Guide

## 📊 Overview

This application now includes a comprehensive, production-ready logging system designed for easy debugging, monitoring, and security auditing in production environments.

## 🚀 Key Features

### ✅ **Production-Ready Logging**
- **Structured Logging**: JSON format in production, human-readable in development
- **Log Levels**: Environment-based control (ERROR, WARN, INFO, DEBUG)
- **Request Tracing**: Unique request IDs for end-to-end tracing
- **Security Logging**: Dedicated security event logging
- **Data Sanitization**: Automatic redaction of sensitive information
- **Global Exception Handling**: Comprehensive error capture and logging

### 🔧 **Logging Components**

1. **Enhanced Logger Utility** (`src/utils/logger.ts`)
2. **Global Exception Filter** (`src/common/filters/global-exception.filter.ts`)
3. **Request/Response Logging** (`src/common/middlewares/logger.middleware.ts`)
4. **Security Event Logging** (Built into auth middleware and exception filter)

## 📋 Configuration

### Environment Variables

```env
# Logging Configuration
LOG_LEVEL=INFO                    # ERROR, WARN, INFO, DEBUG
ENABLE_REQUEST_LOGGING=true       # Enable/disable request logging
ENABLE_DATABASE_LOGGING=true      # Enable/disable database query logging
ENABLE_SECURITY_LOGGING=true      # Enable/disable security event logging
LOG_TO_FILE=false                 # Enable file logging (optional)
LOG_FILE_PATH=./logs/app.log      # Log file path (if file logging enabled)
```

### Default Behavior
- **Development**: DEBUG level, human-readable format
- **Production**: INFO level, JSON format for log aggregation

## 📝 Log Formats

### Development Format
```
[2025-07-16T11:32:10.988Z] [INFO] Incoming request [RequestID: 1cd13d70-c174-4172-9b18-06e8e21485b5] [UserID: 123] [Duration: 417ms] [Status: 201]
```

### Production Format (JSON)
```json
{
  "timestamp": "2025-07-16T11:32:10.988Z",
  "level": "INFO",
  "message": "Incoming request",
  "service": "nestjs-auth-api",
  "environment": "production",
  "requestId": "1cd13d70-c174-4172-9b18-06e8e21485b5",
  "method": "POST",
  "url": "/api/v1/auth/register",
  "ip": "::1",
  "userAgent": "curl/8.7.1",
  "userId": 123,
  "duration": 417,
  "statusCode": 201
}
```

## 🔍 Log Types

### 1. **Request/Response Logs**
- **Incoming requests** with method, URL, IP, user agent
- **Completed requests** with status code, duration, response size
- **Request tracing** with unique request IDs

### 2. **Error Logs**
- **Unhandled exceptions** with full context
- **Validation errors** with detailed information
- **Database errors** with query context
- **Authentication failures** with security context

### 3. **Security Logs**
- **Authentication attempts** (success/failure)
- **Authorization failures**
- **Suspicious activities** (rate limiting, etc.)
- **OAuth flow events**

### 4. **Business Event Logs**
- **User registration/login**
- **MFA setup/verification**
- **OAuth authentication**
- **Profile updates**

### 5. **Database Logs**
- **Query execution** with parameters (sanitized)
- **Query performance** with duration
- **Connection issues**

## 🛡️ Security Features

### Data Sanitization
Automatically redacts sensitive information:
- Passwords
- Tokens (JWT, OAuth, etc.)
- API keys
- Secrets
- Authorization headers

### Security Event Logging
Special attention to security-related events:
- Authentication failures
- Authorization violations
- Rate limiting triggers
- Suspicious IP patterns

## 🔧 Usage Examples

### Basic Logging
```typescript
import { logInfoMessage, logError, logWarning, logDebug } from '../utils/logger';

// Info logging
logInfoMessage('User created successfully', { userId: 123, email: 'user@example.com' });

// Error logging with exception
try {
  // Some operation
} catch (error) {
  logError('Failed to create user', error, { userId: 123 });
}

// Warning logging
logWarning('High memory usage detected', { memoryUsage: '85%' });

// Debug logging (only in development)
logDebug('Processing user data', { dataSize: 1024 });
```

### Specialized Logging
```typescript
import { logRequest, logResponse, logSecurityEvent, logBusinessEvent } from '../utils/logger';

// Request logging (handled by middleware)
logRequest(req, { additionalContext: 'value' });

// Response logging (handled by middleware)
logResponse(req, res, duration, { additionalContext: 'value' });

// Security events
logSecurityEvent('Failed login attempt', userId, { ip: '192.168.1.1' });

// Business events
logBusinessEvent('User registered', userId, { method: 'oauth', provider: 'google' });
```

## 📊 Production Monitoring

### Log Aggregation
The JSON format in production is designed for:
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **AWS CloudWatch**
- **Google Cloud Logging**
- **Azure Monitor**
- **Datadog**
- **New Relic**

### Key Metrics to Monitor
1. **Response Times**: Track performance degradation
2. **Error Rates**: Monitor application health
3. **Security Events**: Detect potential threats
4. **Database Performance**: Identify slow queries
5. **Authentication Patterns**: Detect unusual activity

### Alerting Setup
Configure alerts for:
- Error rate > 5%
- Response time > 2 seconds
- Security event frequency
- Database connection failures
- Memory/CPU usage spikes

## 🚨 Troubleshooting

### Common Issues

1. **High Log Volume**
   - Increase log level to WARN or ERROR
   - Disable request logging if not needed
   - Use log rotation

2. **Missing Request IDs**
   - Ensure RequestIdMiddleware is applied globally
   - Check middleware order in app.module.ts

3. **Sensitive Data in Logs**
   - Verify data sanitization is working
   - Check for new sensitive fields to add to sanitization

4. **Performance Impact**
   - Use async logging for high-volume operations
   - Consider log buffering for production

### Debug Commands
```bash
# Test logging levels
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Check logs with request ID
grep "1cd13d70-c174-4172-9b18-06e8e21485b5" logs/app.log

# Monitor error rates
grep "ERROR" logs/app.log | wc -l
```

## 📈 Performance Considerations

### Logging Best Practices
1. **Use appropriate log levels** - Don't log everything as INFO
2. **Include context** - Always include relevant metadata
3. **Sanitize data** - Never log sensitive information
4. **Use structured logging** - Makes parsing easier
5. **Monitor log volume** - Prevent disk space issues

### Optimization Tips
- **Async logging** for high-volume operations
- **Log buffering** to reduce I/O operations
- **Log rotation** to manage file sizes
- **Sampling** for high-traffic endpoints

## 🔄 Migration from Old Logging

The new logging system is backward compatible. Existing code using:
- `console.log()` → `logInfoMessage()`
- `console.error()` → `logError()`
- `console.warn()` → `logWarning()`

Will continue to work, but consider migrating to the new structured logging for better production monitoring.

---

This logging system provides comprehensive visibility into your application's behavior, making debugging and monitoring much easier in production environments. 