# 🏗️ Entity-Based Architecture: Clean Separation of Concerns

## Overview

The codebase has been refactored to use a **clean entity-based architecture** that separates concerns properly:

- **DTOs** → API contracts (in modules)
- **Entities** → Business logic (in repositories)
- **Repository** → Data access with entities
- **Service** → Converts DTOs to entities

## 🎯 Architecture Benefits

### **1. Clear Separation of Concerns**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controller    │    │     Service     │    │   Repository    │
│                 │    │                 │    │                 │
│  Uses DTOs      │───▶│ DTO → Entity    │───▶│ Uses Entities   │
│  (API Layer)    │    │ (Business Logic)│    │ (Data Layer)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **2. Type Safety & IntelliSense**
- **DTOs**: Define API contracts with validation
- **Entities**: Provide business logic and computed properties
- **Repository**: Returns typed entities, not raw database objects

### **3. Business Logic Encapsulation**
- Entities contain business rules and computed properties
- Repository methods work with entities, not raw data
- Service layer orchestrates the conversion

## 📁 File Structure

```
src/
├── apis/
│   └── auth/
│       ├── dto/
│       │   └── auth.dto.ts          # API contracts
│       ├── auth.service.ts          # Converts DTOs → Entities
│       └── auth.controller.ts       # Uses DTOs
├── repositories/
│   ├── entities/
│   │   ├── user.entity.ts           # User business logic
│   │   ├── refresh-token.entity.ts  # Token business logic
│   │   └── oauth-user-info.entity.ts # OAuth business logic
│   └── auth.repository.ts           # Uses entities
```

## 🔄 Data Flow

### **1. API Request Flow**
```typescript
// 1. Controller receives DTO
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}

// 2. Service converts DTO to Entity
async register(registerDto: RegisterDto): Promise<any> {
  const userEntity = UserEntity.createLocalUser({
    email: registerDto.email,
    password: hashedPassword,
    // ...
  });
  
  const user = await this.authRepository.createUser(userEntity);
  return user.toResponse();
}

// 3. Repository works with Entity
async createUser(userEntity: UserEntity): Promise<UserEntity> {
  const user = await prisma.user.create({
    data: userEntity.toDatabase(),
  });
  return new UserEntity(user);
}
```

### **2. Entity Business Logic**
```typescript
// Entity contains business logic
export class UserEntity {
  // Factory methods
  static createLocalUser(data): UserEntity { /* ... */ }
  static createOAuthUser(data): UserEntity { /* ... */ }
  
  // Update methods (immutable)
  updateProfile(data): UserEntity { /* ... */ }
  updatePassword(password): UserEntity { /* ... */ }
  updateMfa(data): UserEntity { /* ... */ }
  
  // Computed properties
  get fullName(): string { /* ... */ }
  get isOAuthUser(): boolean { /* ... */ }
  get hasMfaEnabled(): boolean { /* ... */ }
  
  // Conversion methods
  toDatabase(): any { /* ... */ }
  toResponse(): any { /* ... */ }
}
```

## ✅ Key Improvements

### **1. Immutable Updates**
```typescript
// Before: Mutable updates
await this.authRepository.updateUser(userId, { lastLoginAt: new Date() });

// After: Immutable entity updates
const updatedUser = user.updateLoginTime();
await this.authRepository.updateUser(updatedUser);
```

### **2. Business Logic in Entities**
```typescript
// Entity contains business rules
get isEmailOtpValid(): boolean {
  return !!(this.emailOtp && this.emailOtpExpiresAt && this.emailOtpExpiresAt > new Date());
}

get isOAuthUser(): boolean {
  return !!(this.oauthProvider && this.oauthId);
}
```

### **3. Type Safety**
```typescript
// Repository returns typed entities
async findUserByEmail(email: string): Promise<UserEntity | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? new UserEntity(user) : null;
}

// Service works with entities
const user = await this.authRepository.findUserByEmail(email);
if (user && user.isOAuthUser) {
  // Type-safe access to business logic
}
```

### **4. Clean Data Conversion**
```typescript
// Entity handles data conversion
toDatabase(): any {
  return {
    email: this.email,
    password: this.password,
    // ... all fields for Prisma
  };
}

toResponse(): any {
  return {
    id: this.id,
    email: this.email,
    fullName: this.fullName, // Computed property
    // ... API response format
  };
}
```

## 🧪 Testing Results

The refactored architecture has been tested and works correctly:

```bash
# User Registration ✅
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test-entity@example.com", "password": "password123"}'

# Response includes computed properties from entity
{
  "user": {
    "id": 10,
    "email": "test-entity@example.com",
    "firstName": "Test",
    "lastName": "Entity",
    "isActive": true,
    "isEmailVerified": false,
    "mfaEnabled": false,
    // ... all entity properties
  }
}
```

## 🎯 Benefits Achieved

### **1. Maintainability**
- Clear separation between API contracts (DTOs) and business logic (Entities)
- Business rules are centralized in entities
- Easy to modify data structures without breaking API contracts

### **2. Type Safety**
- Repository methods return typed entities
- Compile-time validation of business logic
- IntelliSense support for all entity methods

### **3. Testability**
- Entities can be tested independently
- Business logic is isolated from data access
- Easy to mock entities for service testing

### **4. Performance**
- No redundant data transformation
- Entities are created once and reused
- Efficient database operations

### **5. Code Clarity**
- Self-documenting architecture
- Clear data flow from DTOs → Entities → Database
- Business logic is explicit and discoverable

## 🚀 Next Steps

This architecture provides a solid foundation for:

1. **Domain-Driven Design**: Entities can evolve into rich domain objects
2. **Event Sourcing**: Entities can emit domain events
3. **CQRS**: Separate read/write models using entities
4. **Microservices**: Entities can be shared across services

The architecture is now **clean, maintainable, and scalable**! 🎉 