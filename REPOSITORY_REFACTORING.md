# Repository Refactoring: From Inline Types to Proper DTOs and Entities

## Overview

This document outlines the refactoring of the authentication repository methods from using inline object types to proper DTOs (Data Transfer Objects) and entities. This improves type safety, maintainability, and code clarity.

## What Was Refactored

### 1. Created Comprehensive DTOs (`src/apis/auth/dto/auth.dto.ts`)

#### User Creation DTOs
- `CreateUserDto` - General user creation
- `CreateOAuthUserDto` - OAuth-specific user creation
- `CreateLocalUserDto` - Local user creation with password

#### User Update DTOs
- `UpdateUserDto` - General user updates
- `UpdateUserProfileDto` - Profile-specific updates
- `UpdateUserPasswordDto` - Password updates
- `UpdateUserMfaDto` - MFA configuration updates
- `UpdateUserOtpDto` - OTP-related updates
- `UpdateUserVerificationDto` - Email/password verification updates
- `UpdateUserOAuthDto` - OAuth linking updates

#### Authentication DTOs
- `LoginDto`, `RegisterDto`, `OAuthLoginDto`
- `RefreshTokenDto`, `SendOtpDto`, `VerifyOtpDto`
- `ForgotPasswordDto`, `ResetPasswordDto`, `VerifyEmailDto`

#### Response DTOs
- `UserProfileDto` - User profile response
- `AuthResponseDto` - Authentication response
- `OAuthUrlResponseDto` - OAuth URL response

### 2. Created Entity Classes (`src/apis/auth/entities/auth.entity.ts`)

#### UserEntity
- Complete user data structure with all fields
- Factory methods for different user types:
  - `createLocalUser()` - For password-based users
  - `createOAuthUser()` - For OAuth users
- Specialized update methods:
  - `updateProfile()` - Profile updates
  - `updatePassword()` - Password updates
  - `updateMfa()` - MFA configuration
  - `updateOtp()` - OTP management
  - `updateVerification()` - Verification tokens
  - `updateOAuth()` - OAuth linking
  - `updateLoginTime()` - Login timestamp
  - `updateEmailVerification()` - Email verification status
- Utility methods:
  - `clearOtp()` - Clear OTP data
  - `clearPasswordReset()` - Clear password reset tokens
  - `clearEmailVerification()` - Clear email verification tokens
- Computed properties:
  - `fullName` - User's full name
  - `isOAuthUser` - Check if OAuth user
  - `isLocalUser` - Check if local user
  - `hasMfaEnabled` - Check MFA status
  - Token validity checks for OTP and verification tokens

#### RefreshTokenEntity
- Refresh token data structure
- Factory method `create()` for new tokens
- `revoke()` method for token revocation
- Utility properties `isExpired` and `isValid`

#### OAuthUserInfoEntity
- OAuth user information structure
- `fullName` computed property

### 3. Refactored Repository Methods (`src/repositories/auth.repository.ts`)

#### Before (Inline Types)
```typescript
async createUser(userData: {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  oauthProvider?: string;
  oauthId?: string;
  isEmailVerified?: boolean;
}): Promise<User>

async updateUser(id: number, updates: {
  password?: string;
  firstName?: string;
  // ... many more fields
}): Promise<User>
```

#### After (Typed DTOs)
```typescript
async createUser(userData: CreateUserDto): Promise<User>
async createOAuthUser(userData: CreateOAuthUserDto): Promise<User>
async createLocalUser(userData: CreateLocalUserDto): Promise<User>

async updateUser(id: number, updates: UpdateUserDto): Promise<User>
async updateUserProfile(id: number, updates: UpdateUserProfileDto): Promise<User>
async updateUserPassword(id: number, updates: UpdateUserPasswordDto): Promise<User>
async updateUserMfa(id: number, updates: UpdateUserMfaDto): Promise<User>
async updateUserOtp(id: number, updates: UpdateUserOtpDto): Promise<User>
async updateUserVerification(id: number, updates: UpdateUserVerificationDto): Promise<User>
async updateUserOAuth(id: number, updates: UpdateUserOAuthDto): Promise<User>
async updateUserLoginTime(id: number): Promise<User>
async updateEmailVerification(id: number, isVerified: boolean): Promise<User>
async clearUserOtp(id: number): Promise<User>
async clearPasswordReset(id: number): Promise<User>
async clearEmailVerification(id: number): Promise<User>
```

### 4. Updated Service Layer (`src/apis/auth/auth.service.ts`)

- Replaced inline object types with proper DTOs
- Used entity factory methods for data creation
- Leveraged specialized repository methods
- Improved type safety throughout the service

## Benefits of This Refactoring

### 1. **Type Safety**
- Compile-time validation of data structures
- IntelliSense support for all properties
- Reduced runtime errors from malformed data

### 2. **Maintainability**
- Clear separation of concerns
- Easy to modify data structures
- Centralized validation logic

### 3. **Code Clarity**
- Self-documenting code with meaningful type names
- Reduced cognitive load when reading methods
- Better IDE support with autocomplete

### 4. **Reusability**
- DTOs can be reused across different services
- Entity methods provide consistent data manipulation
- Factory methods ensure consistent object creation

### 5. **Testing**
- Easier to mock and test with typed interfaces
- Better test coverage with type checking
- Clearer test expectations

## Usage Examples

### Creating a Local User
```typescript
const userData: CreateLocalUserDto = {
  email: "user@example.com",
  password: "hashedPassword",
  firstName: "John",
  lastName: "Doe",
  phoneNumber: "+1234567890",
  isEmailVerified: false
};

const user = await authRepository.createLocalUser(userData);
```

### Updating User Profile
```typescript
const profileUpdates: UpdateUserProfileDto = {
  firstName: "Jane",
  lastName: "Smith",
  phoneNumber: "+0987654321"
};

await authRepository.updateUserProfile(userId, profileUpdates);
```

### Managing OTP
```typescript
const otpData: UpdateUserOtpDto = {
  emailOtp: "123456",
  emailOtpExpiresAt: new Date(Date.now() + 300000) // 5 minutes
};

await authRepository.updateUserOtp(userId, otpData);
```

## Migration Notes

- All existing functionality is preserved
- No breaking changes to public APIs
- Backward compatibility maintained
- Gradual migration possible

## Testing

Run the test script to verify the refactored methods work correctly:

```bash
./test-typed-repository.sh
```

This will test:
1. User registration with typed DTOs
2. User login with typed methods
3. OAuth URL generation

## Future Improvements

1. **Validation Integration**: Add Joi validation schemas to DTOs
2. **API Documentation**: Generate OpenAPI specs from DTOs
3. **Database Migrations**: Ensure Prisma schema matches entity structures
4. **Performance**: Consider using DTOs for database queries
5. **Caching**: Implement entity caching strategies 