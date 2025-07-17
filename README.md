# 🚀 NestJS Project with Prisma & PostgreSQL

A production-ready NestJS application following enterprise-level coding standards and architectural patterns.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [API Documentation](#api-documentation)
- [Coding Standards](#coding-standards)
- [Architecture Patterns](#architecture-patterns)

## ✨ Features

- **NestJS Framework** - Scalable Node.js server-side applications
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **Bull Queues** - Background job processing with Redis
- **Joi Validation** - Schema-based validation (NOT class-validator)
- **JWT Authentication** - Secure authentication with custom middleware
- **TypeScript** - Full type safety and modern JavaScript features
- **ESLint + Prettier** - Code quality and formatting
- **Husky** - Git hooks for code quality
- **Docker Ready** - Container support for deployment

## 🛠️ Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue System:** Bull + Redis
- **Validation:** Joi
- **Authentication:** JWT + Custom middleware
- **Code Quality:** ESLint + Prettier + Husky

## 📁 Project Structure

```
/project-root
  ├── src/
  │   ├── apis/                    # Feature modules
  │   │   └── users/               # Example user feature
  │   │       ├── dto/
  │   │       ├── users.controller.ts
  │   │       ├── users.service.ts
  │   │       ├── users.validator.ts
  │   │       └── users.module.ts
  │   ├── common/
  │   │   ├── constants/           # Queue constants
  │   │   ├── entities/            # Common entities
  │   │   ├── enums/               # Enums and constants
  │   │   ├── middlewares/         # Custom middlewares
  │   │   ├── prisma.ts           # Prisma client instance
  │   │   └── response.ts         # Response interfaces
  │   ├── config/
  │   │   └── config.ts           # Centralized configuration
  │   ├── crons/                  # Scheduled tasks
  │   ├── helpers/                # External service helpers
  │   ├── i18n/                   # Internationalization
  │   ├── queues/
  │   │   ├── processors/         # Queue processors
  │   │   ├── queue-processors.module.ts
  │   │   └── queue-producers.module.ts
  │   ├── repositories/           # Data access layer
  │   ├── seeds/                  # Database seeders
  │   ├── utils/                  # Utility functions
  │   ├── app.controller.ts
  │   ├── app.module.ts
  │   ├── app.service.ts
  │   └── main.ts
  ├── prisma/
  │   ├── schema.prisma
  │   └── migrations/
  ├── scripts/                    # Deployment scripts
  ├── .github/                    # GitHub workflows
  ├── .husky/                     # Git hooks
  └── .vscode/                    # VS Code settings
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v13+)
- Redis (v6+)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nestjs-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Start the development server**
```bash
   npm run start:dev
   ```

The application will be available at `http://localhost:3000/api/v1`

## 🔧 Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"

# Authentication & Security
AUTH_JWT_SECRET="your-super-secret-jwt-key"
AUTH_REFRESH_JWT_SECRET="your-super-secret-refresh-jwt-key"
TOKEN_EXPIRATION="24h"
REFRESH_TOKEN_EXPIRATION="30d"

# External Services
PAYMENT_SERVICE_URL="http://localhost:3001"
MFA_SERVICE_URL="http://localhost:3002"
NOTIFICATION_SERVICE_URL="http://localhost:3003"

# Queue Configuration (Redis)
REDIS_URL="redis://localhost:6379"

# Application
NODE_ENV="development"
PORT=3000
```

## 🗄️ Database Setup

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database (optional)
npm run db:seed
```

### Database Schema

The project includes a base User model in `prisma/schema.prisma`:

```prisma
model User {
  id         Int      @id @default(autoincrement())
  email      String   @unique
  password   String
  firstName  String?  @map("first_name")
  lastName   String?  @map("last_name")
  isActive   Boolean  @default(true) @map("is_active")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

## 📚 API Documentation

### Users API

The project includes a complete users API as an example:

#### Endpoints

- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users` - Get users with pagination
- `GET /api/v1/users/:id` - Get user by ID
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

#### Example Request

```bash
# Create a new user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Example Response

```json
{
  "statusCode": 201,
  "message": "Operation completed successfully",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## 📐 Coding Standards

### Key Principles

1. **Feature-first organization** - Group by business domain
2. **Joi validation** - Never use class-validator decorators
3. **Consistent error handling** - Always use utility functions
4. **Repository pattern** - Abstract database operations
5. **Queue-based processing** - For async/heavy operations
6. **Standardized responses** - Consistent API response structure

### File Naming Conventions

- **Files:** `kebab-case.ts` or `camelCase.ts`
- **Classes:** `PascalCase`
- **Variables/functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Database fields:** `snake_case` in Prisma, `camelCase` in TypeScript

### Import Conventions

```typescript
// External libraries first
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Joi from 'joi';

// Internal modules (relative imports)
import { UserRepository } from '../../repositories/user.repository';
import { Constants } from '../../common/enums/generic.enum';

// Relative imports within the same module
import { CreateUserDto } from './dto/users.dto';
```

## 🏗️ Architecture Patterns

### Controller Pattern

```typescript
@Controller('api/v1/users')
export class UsersController {
  @Post()
  async createUser(@Body() body: CreateUserDto, @Res() res: Response) {
    const { status, ...restOfResponse } = await this.usersService.createUser(body);
    return res.status(status).json(restOfResponse);
  }
}
```

### Service Pattern

```typescript
@Injectable()
export class UsersService {
  async createUser(requestBody: CreateUserDto): Promise<any> {
    try {
      // Step 1: Validation
      const validatedParams = await this.validator.validateCreateRequest(requestBody);
      
      // Step 2: Business logic
      const result = await this.repository.create(validatedParams);
      
      // Step 3: Additional processing (queues, notifications)
      await this.queue.add('user-created', { id: result.id });
      
      // Step 4: Response formatting
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      logError(`Error creating user ==> ${error}`);
      return generateErrorResponse(error);
    }
  }
}
```

### Validator Pattern

```typescript
@Injectable()
export class UsersValidator {
  async validateCreateRequest(params: CreateUserDto): Promise<any> {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });
    
    const error = validateJoiSchema(schema, params);
    if (error) throwError(error, HttpStatus.BAD_REQUEST);
    
    // Business validation
    const existingUser = await this.repository.findByEmail(params.email);
    if (existingUser) {
      throwError('User already exists', HttpStatus.CONFLICT);
    }
    
    return params;
  }
}
```

### Repository Pattern

```typescript
@Injectable()
export class UserRepository {
  async create(data: CreateUserData): Promise<any> {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  }
}
```

## 🔄 Queue System

The project uses Bull queues for background processing:

```typescript
// In service
await this.notificationQueue.add('user-created', { userId, email });

// Processor
@Processor(PROCESS_NOTIFICATION_QUEUE)
export class NotificationQueueProcessor {
  @Process('user-created')
  async handleUserCreated(job: Job<any>) {
    // Process the job
  }
}
```

## 📝 Available Scripts

```bash
# Development
npm run start:dev          # Start development server
npm run start:debug        # Start with debugging

# Building
npm run build              # Build for production
npm run start:prod         # Start production server

# Database
npm run db:generate        # Generate Prisma client
npm run db:migrate         # Run migrations
npm run db:seed           # Seed database

# Code Quality
npm run lint              # Run ESLint
npm run format            # Format with Prettier

# Testing
npm run test              # Run tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage
```

## 🚀 Deployment

The project includes deployment scripts in the `scripts/` directory:

- `before_install.sh` - Pre-deployment cleanup
- `after_install.sh` - Post-deployment setup
- `application_start.sh` - Application startup

## 🤝 Contributing

1. Follow the established coding patterns
2. Use Joi for validation (not class-validator)
3. Implement proper error handling
4. Add appropriate logging
5. Update documentation

## 📄 License

This project is licensed under the MIT License.

---

For more detailed information about the coding standards and patterns, refer to the style guide documentation.
