# Authentication API Endpoints

Complete documentation of all authentication endpoints with payload examples and curl commands.

## 🔐 Authentication Flow

### 1. **Registration & Login**

#### **Register User**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+1234567890"
  }'
```

#### **Login**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

#### **Logout**
```bash
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### **Refresh Token**
```bash
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### 2. **OAuth Authentication**

#### **OAuth Login**
```bash
POST /api/v1/auth/oauth/login
Content-Type: application/json

{
  "provider": "google",
  "code": "4/0AfJohXn..."
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/oauth/login \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "code": "4/0AfJohXn..."
  }'
```

#### **Get OAuth URL**
```bash
GET /api/v1/auth/oauth/google/url?redirect_uri=http://localhost:3000/callback
```

**Curl:**
```bash
curl -X GET "http://localhost:3000/api/v1/auth/oauth/google/url?redirect_uri=http://localhost:3000/callback"
```

### 3. **Email Verification**

#### **Verify Email**
```bash
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### **Resend Verification**
```bash
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### 4. **Password Management**

#### **Forgot Password**
```bash
POST /api/v1/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

#### **Reset Password**
```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "password": "NewPassword123!"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "password": "NewPassword123!"
  }'
```

#### **Change Password**
```bash
POST /api/v1/auth/change-password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/change-password \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

## 🔒 MFA (Multi-Factor Authentication) Flow

### **Setup MFA (TOTP)**
```bash
POST /api/v1/auth/mfa/setup
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "method": "totp"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "totp"
  }'
```

### **Enable MFA**
```bash
POST /api/v1/auth/mfa/enable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "code": "123456"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/enable \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

### **Disable MFA**
```bash
POST /api/v1/auth/mfa/disable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "code": "123456"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/disable \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

### **Verify MFA**
```bash
POST /api/v1/auth/verify-mfa
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "code": "123456",
  "method": "totp"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-mfa \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "method": "totp"
  }'
```

## 📱 OTP (One-Time Password) Flow

### **Send OTP**
```bash
POST /api/v1/auth/otp/send
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "method": "email"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/otp/send \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email"
  }'
```

### **Verify Email OTP**
```bash
POST /api/v1/auth/verify-email-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-email-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### **Verify SMS OTP**
```bash
POST /api/v1/auth/verify-sms-otp
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-sms-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "otp": "123456"
  }'
```

### **Verify TOTP**
```bash
POST /api/v1/auth/verify-totp
Content-Type: application/json

{
  "code": "123456"
}
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-totp \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

## 👤 User Profile Management

### **Get Profile**
```bash
GET /api/v1/auth/profile
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <access-token>"
```

### **Update Profile**
```bash
PUT /api/v1/auth/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "phoneNumber": "+1234567890"
}
```

**Curl:**
```bash
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "phoneNumber": "+1234567890"
  }'
```

## 🗑️ Account Management

### **Deactivate Account**
```bash
POST /api/v1/auth/deactivate-account
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/deactivate-account \
  -H "Authorization: Bearer <access-token>"
```

### **Delete Account**
```bash
DELETE /api/v1/auth/delete-account
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "password": "Password123!"
}
```

**Curl:**
```bash
curl -X DELETE http://localhost:3000/api/v1/auth/delete-account \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Password123!"
  }'
```

### **Unlock Account**
```bash
POST /api/v1/auth/unlock-account
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/unlock-account \
  -H "Authorization: Bearer <access-token>"
```

## 🔐 Session & Security

### **Get Active Sessions**
```bash
GET /api/v1/auth/active-sessions
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/active-sessions \
  -H "Authorization: Bearer <access-token>"
```

### **Revoke All Sessions**
```bash
POST /api/v1/auth/revoke-all-sessions
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/revoke-all-sessions \
  -H "Authorization: Bearer <access-token>"
```

### **Get Security Activity**
```bash
GET /api/v1/auth/security-activity
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X GET http://localhost:3000/api/v1/auth/security-activity \
  -H "Authorization: Bearer <access-token>"
```

### **Reset User MFA**
```bash
POST /api/v1/auth/reset-user-mfa
Authorization: Bearer <access-token>
```

**Curl:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-user-mfa \
  -H "Authorization: Bearer <access-token>"
```

## 📋 Complete MFA Testing Flow Example

### **Step 1: Login**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### **Step 2: Setup MFA**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/setup \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "totp"
  }'
```

### **Step 3: Enable MFA**
```bash
curl -X POST http://localhost:3000/api/v1/auth/mfa/enable \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

### **Step 4: Test MFA Verification**
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-mfa \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456",
    "method": "totp"
  }'
```

## 📝 Response Format

All endpoints return responses in the following format:

### **Success Response:**
```json
{
  "message": "Success message",
  "data": { ... },
  "status": 200
}
```

### **Error Response:**
```json
{
  "message": "Error message",
  "error": "Error details",
  "status": 400
}
```

## 🔧 Notes

- All endpoints include the global prefix `/api/v1/`
- Authentication endpoints require `Authorization: Bearer <access-token>` header
- Content-Type should be `application/json` for POST/PUT requests
- Replace `<access-token>` with the actual JWT token received from login
- Replace placeholder values (emails, passwords, tokens) with actual values 