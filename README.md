# 🚀 NestJS Project with Prisma & PostgreSQL

A production-ready NestJS application following enterprise-level coding standards and architectural patterns.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Documentation](#documentation)
- [Quick Start](#quick-start)

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
  │   │   ├── auth/               # Authentication & 2FA
  │   │   ├── users/              # User management
  │   │   ├── api-keys/           # API key management
  │   │   └── admin/              # Admin functionality
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
   cp env-template.txt .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Seed the database**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

## 🔧 Environment Setup

Copy `env-template.txt` to `.env` and configure the following variables:

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `AUTH_JWT_SECRET` - JWT signing secret
- `AUTH_REFRESH_JWT_SECRET` - JWT refresh secret

### Optional Variables
- `SUPER_ADMIN_EMAIL` - Super admin email (production only)
- `SUPER_ADMIN_PASSWORD` - Super admin password (production only)
- OAuth provider credentials (Google, GitHub, etc.)

## 🗄️ Database Setup

1. **Create PostgreSQL database**
   ```sql
   CREATE DATABASE your_database_name;
   ```

2. **Run migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Seed initial data**
   ```bash
   npm run seed
   ```

## 📚 Documentation

**📖 [Complete Documentation](DOCUMENTATION.md)**

The project documentation has been consolidated into a single comprehensive file that includes:

- **Architecture & Design** - Project structure and design patterns
- **Authentication & Security** - 2FA, OAuth, and security features
- **API Endpoints** - Complete API reference
- **Development Guidelines** - Coding standards and best practices
- **Production & Deployment** - Deployment and production setup
- **Testing & Quality Assurance** - Testing strategies and quality guidelines

## ⚡ Quick Start

1. **Start the application**
   ```bash
   npm run start:dev
   ```

2. **Access the API**
   - Base URL: `http://localhost:3000`
   - Health Check: `GET /health`
   - API Documentation: See [DOCUMENTATION.md](DOCUMENTATION.md)

3. **Create your first user**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'
   ```

4. **Login and get API key**
   ```bash
   # Login
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password123"}'
   
   # Create API key (use the access token from login)
   curl -X POST http://localhost:3000/api/v1/api-keys \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"My API Key","description":"For testing"}'
   ```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
