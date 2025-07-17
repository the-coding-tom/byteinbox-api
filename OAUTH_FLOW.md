# OAuth Authentication Flow Documentation

## Overview

This implementation supports **two OAuth flows** for Google and GitHub authentication using **middleware-based authentication**:

1. **Authorization Code Flow** (Standard OAuth 2.0) - Recommended for production
2. **Direct Token Flow** (For testing/development) - Alternative approach

## 🔄 Complete OAuth Flow

### Phase 1: OAuth URL Generation

**Endpoint:** `GET /api/v1/auth/oauth/:provider/url`

**Purpose:** Get the OAuth authorization URL for the specified provider

**Parameters:**
- `provider`: `google`, `github`, `facebook`, or `twitter`
- `redirect_uri` (optional): Custom redirect URI

**Example:**
```bash
curl "http://localhost:3000/api/v1/auth/oauth/google/url"
```

**Response:**
```json
{
  "statusCode": 200,
  "success": true,
  "message": "OAuth URL generated successfully",
  "data": {
    "url": "https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...&scope=...&response_type=code&access_type=offline&state=...",
    "provider": "google"
  }
}
```

### Phase 2: OAuth Provider Authorization

**External Call:** User is redirected to OAuth provider
- **Google:** `https://accounts.google.com/o/oauth2/v2/auth?...` (OAuth 2.0 v2 endpoint)
- **GitHub:** `https://github.com/login/oauth/authorize?...`

**Flow:** User authenticates with provider and grants permissions

### Phase 3: OAuth Callback

**External Redirect:** OAuth provider redirects to your callback URL
- **URL:** `http://localhost:3000/api/v1/auth/callback?code=AUTHORIZATION_CODE&state=STATE_VALUE`
- **Note:** This is handled by your backend callback handler

### Phase 4: Token Exchange & User Authentication

**Endpoint:** `POST /api/v1/auth/oauth/login`

**Purpose:** Exchange authorization code for tokens and authenticate user

## 📋 Authorization Code Flow (Standard OAuth 2.0)

### Request Format
```json
{
  "provider": "google",
  "code": "AUTHORIZATION_CODE_FROM_PROVIDER"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/v1/auth/oauth/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "code": "4/0AfJohXn..."
  }'
```

### Internal Flow
1. **Validation:** Validates provider and authorization code
2. **Code Exchange:** `OAuthHelper.exchangeCodeForToken()` exchanges code for access token
3. **Token Verification:** `OAuthHelper.verifyOAuthToken()` verifies token with provider
4. **User Lookup:** Checks if user exists by OAuth ID
5. **User Creation/Linking:** Creates new user or links OAuth to existing account
6. **Token Generation:** Generates JWT access and refresh tokens
7. **Response:** Returns tokens and user profile

## 🔑 Direct Token Flow (For Testing)

### Request Format
```json
{
  "provider": "google",
  "accessToken": "ACCESS_TOKEN_FROM_PROVIDER"
}
```

### Example
```bash
curl -X POST http://localhost:3000/api/v1/auth/oauth/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "accessToken": "ya29.a0AfH6SMC..."
  }'
```

### Internal Flow
1. **Validation:** Validates provider and access token
2. **Token Verification:** `OAuthHelper.verifyOAuthToken()` verifies token with provider
3. **User Lookup:** Checks if user exists by OAuth ID
4. **User Creation/Linking:** Creates new user or links OAuth to existing account
5. **Token Generation:** Generates JWT access and refresh tokens
6. **Response:** Returns tokens and user profile

## ✅ Success Response

Both flows return the same response format:

```json
{
  "statusCode": 200,
  "success": true,
  "message": "OAuth login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "email": "user@gmail.com",
      "firstName": "John",
      "lastName": "Doe",
      "isEmailVerified": true,
      "mfaEnabled": false,
      "oauthProvider": "google",
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

## ❌ Error Responses

### Invalid Authorization Code
```json
{
  "statusCode": 401,
  "success": false,
  "message": "OAuth verification failed: Failed to exchange Google code for token"
}
```

### Invalid Provider
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Unsupported OAuth provider: invalid_provider"
}
```

### Missing Required Fields
```json
{
  "statusCode": 400,
  "success": false,
  "message": "Either authorization code or access token must be provided"
}
```

### Account Deactivated
```json
{
  "statusCode": 401,
  "success": false,
  "message": "Account is deactivated"
}
```

## 🔧 Configuration

### Environment Variables Required

**Google OAuth:**
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**GitHub OAuth:**
```bash
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

**OAuth Redirect URI:**
```bash
OAUTH_REDIRECT_URI=http://localhost:3000/api/v1/auth/callback
```

## 🧪 Testing

### Quick Test Commands

1. **Test OAuth URL Generation:**
```bash
curl "http://localhost:3000/api/v1/auth/oauth/google/url"
```

2. **Test OAuth Login with Authorization Code:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/oauth/login \
  -H "Content-Type: application/json" \
  -d '{"provider": "google", "code": "YOUR_AUTHORIZATION_CODE"}'
```

3. **Use the Test Script:**
```bash
./test-middleware-auth.sh
```

## 🔍 Recent Fixes

### Google OAuth Verification
- **Issue:** Google OAuth was trying to verify ID tokens instead of access tokens
- **Fix:** Updated `verifyGoogleToken()` to use Google's userinfo endpoint with Bearer token
- **Impact:** Proper verification of access tokens from authorization code flow

### Token Exchange
- **Issue:** Google code exchange was trying to return ID tokens instead of access tokens
- **Fix:** Updated `exchangeGoogleCode()` to always return access tokens
- **Impact:** Consistent token handling across all OAuth providers

### Error Handling
- **Issue:** Generic error messages made debugging difficult
- **Fix:** Added detailed error logging and specific error messages
- **Impact:** Better debugging and user feedback

### Debug Logging
- **Issue:** Limited visibility into OAuth flow steps
- **Fix:** Added comprehensive debug logging throughout the OAuth process
- **Impact:** Easier troubleshooting and flow monitoring

### Middleware-Based Authentication
- **Issue:** Using guards for authentication limited flexibility
- **Fix:** Implemented middleware-based authentication with route-specific protection
- **Impact:** More flexible authentication control and better separation of concerns

## 🚨 Common Issues & Solutions

### "OAuth verification failed"
1. **Cause:** Expired or invalid authorization code
2. **Solution:** Get a fresh authorization code (they expire in 5-10 minutes)

### "Account is deactivated"
1. **Cause:** User created but `isActive` field is false
2. **Solution:** Check database or implement account activation logic

### "Failed to exchange Google code for token"
1. **Cause:** Invalid redirect URI or expired code
2. **Solution:** Verify redirect URI matches exactly and use fresh code

### "No access token received from Google"
1. **Cause:** Google OAuth configuration issue
2. **Solution:** Check Google OAuth app settings and credentials

### "Authorization token required"
1. **Cause:** Accessing protected route without authentication
2. **Solution:** Include valid Bearer token in Authorization header

## 📝 Testing Checklist

- [ ] OAuth URLs generate correctly
- [ ] Authorization codes are obtained successfully
- [ ] Token exchange works with fresh codes
- [ ] User creation/linking works properly
- [ ] JWT tokens are generated and returned
- [ ] Error handling provides useful messages
- [ ] Debug logs show flow progression
- [ ] Middleware correctly protects routes
- [ ] Public routes work without authentication
- [ ] Protected routes require valid tokens 