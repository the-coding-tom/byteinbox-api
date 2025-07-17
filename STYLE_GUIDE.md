start a nest js project for me that uses prisma and postgres. I have nvm installed you can use the lastest node version if you want eg “source ~/.nvm/nvm.sh && nvm install node && nvm use node”. Follow the guide and codebase structure to the dot. And don’t create a new app folder generate the code in the current directory. If any folder or file is automatically created by any of the tools/commands, don’t forget to clean up after to match the directory structure guide provided. This is your style guide:

# 🚀 Project Structure & Coding Standards Guide

## 📁 Project Structure

```
/project-root
  ├── src/
  │   ├── apis/
  │   │   ├── [feature]/
  │   │   │   ├── [feature].controller.ts
  │   │   │   ├── [feature].service.ts
  │   │   │   ├── [feature].validator.ts
  │   │   │   ├── [feature].module.ts
  │   │   │   ├── dto/
  │   │   │   │   └── [feature].dto.ts
  │   │   │   └── [subfolder]/ (if needed)
  │   │   └── ...
  │   ├── common/
  │   │   ├── constants/
  │   │   │   └── queues.constant.ts
  │   │   ├── entities/
  │   │   │   └── [entity].entity.ts
  │   │   ├── enums/
  │   │   │   └── generic.enum.ts
  │   │   ├── middlewares/
  │   │   ├── prisma.ts
  │   │   └── response.ts
  │   ├── config/
  │   │   └── config.ts
  │   ├── crons/
  │   │   ├── crons.module.ts
  │   │   └── processes/
  │   ├── helpers/
  │   │   ├── authentication.ts
  │   │   ├── fee-calculator.ts
  │   │   └── [helper].ts
  │   ├── i18n/
  │   │   ├── en/
  │   │   └── fr/
  │   ├── queues/
  │   │   ├── processors/
  │   │   │   └── [job].processor.ts
  │   │   ├── queue-processors.module.ts
  │   │   └── queue-producers.module.ts
  │   ├── repositories/
  │   │   ├── [entity].repository.ts
  │   │   ├── entities/
  │   │   │   └── [repository-dto].entity.ts
  │   │   └── [subfolder]/
  │   ├── seeds/
  │   ├── utils/
  │   │   ├── joi.validator.ts
  │   │   ├── logger.ts
  │   │   └── util.ts
  │   ├── app.controller.ts
  │   ├── app.module.ts
  │   ├── app.service.ts
  │   └── main.ts
  ├── prisma/
  │   ├── schema.prisma
  │   └── migrations/
  ├── scripts/
  │   ├── after_install.sh
  │   ├── application_start.sh
  │   └── before_install.sh
  ├── .github/
  ├── .husky/
  ├── .vscode/
  ├── package.json
  ├── package-lock.json
  ├── tsconfig.json
  ├── tsconfig.build.json
  ├── nest-cli.json
  ├── .eslintrc.js
  ├── .prettierrc
  ├── .gitignore
  ├── Readme.md
  └── appspec.yml
```

## 🎯 Tech Stack Requirements

- **Framework:** NestJS
- **Language:** TypeScript
- **Database ORM:** Prisma
- **Validation:** Joi (NOT class-validator)
- **Queue System:** Bull + Redis
- **Code Style:** Prettier + ESLint
- **Git Hooks:** Husky
- **Authentication:** JWT + Custom middleware
- **API Integration:** Custom API client pattern

## 📝 Detailed Coding Practices & Standards

### 1. 🔍 Validation Strategy

**❌ DO NOT USE:** class-validator decorators  
**✅ USE:** Joi schemas in separate validator classes

#### Validator Pattern:
```typescript
@Injectable()
export class FeatureValidator {
  constructor(
    private readonly repository: SomeRepository,
    // Inject required dependencies
  ) {}

  async validateCreateRequest(params: CreateDto): Promise<any> {
    const schema = Joi.object({
      field1: Joi.string().required(),
      field2: Joi.number().positive().required(),
      field3: Joi.string().email().optional(),
      field4: Joi.string().valid('option1', 'option2').required(),
    });
    
    const error = validateJoiSchema(schema, params);
    if (error) throwError(error, HttpStatus.BAD_REQUEST);
    
    // Additional business validation logic here
    const existingEntity = await this.repository.findByField(params.field1);
    if (existingEntity) {
      throwError('Entity already exists', HttpStatus.CONFLICT);
    }
    
    return params; // or transformed/validated params
  }
}
```

### 2. 📋 DTO Pattern

**DTOs are plain TypeScript classes** - No decorators, just type definitions

```typescript
export class CreateFeatureDto {
  field1: string;
  field2: number;
  field3?: string; // Optional fields with ?
  field4: 'option1' | 'option2'; // Union types for specific values
}

export class UpdateFeatureDto {
  id: number;
  field1?: string; // Optional for updates
  field2?: number;
}

export class FeatureFilterDto {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
```

### 3. 🔧 Service Layer Pattern

**All service methods must follow this structure:**

```typescript
@Injectable()
export class FeatureService {
  constructor(
    private readonly validator: FeatureValidator,
    private readonly repository: FeatureRepository,
    @InjectQueue('QUEUE_NAME') private readonly queue: Queue,
  ) {}

  async createFeature(requestBody: CreateFeatureDto): Promise<any> {
    try {
      // Step 1: Validation
      const validatedParams = await this.validator.validateCreateRequest(requestBody);
      
      // Step 2: Business logic
      const result = await this.repository.create(validatedParams);
      
      // Step 3: Additional processing (queues, notifications, etc.)
      await this.queue.add('process-feature', { id: result.id });
      
      // Step 4: Response formatting
      return generateSuccessResponse({
        statusCode: HttpStatus.CREATED,
        message: Constants.successMessage,
        data: result,
      });
    } catch (error) {
      const errorMessage = `Error creating feature ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }

  async getFeatures(filter: FeatureFilterDto): Promise<any> {
    try {
      const validatedParams = await this.validator.validateGetFeaturesRequest(filter);
      
      const { data, meta } = await this.repository.findWithPagination(validatedParams);
      
      return generateSuccessResponse({
        statusCode: HttpStatus.OK,
        message: Constants.successMessage,
        data,
        meta,
      });
    } catch (error) {
      const errorMessage = `Error retrieving features ==> ${error}`;
      logError(errorMessage);
      return generateErrorResponse(error);
    }
  }
}
```

### 4. 🎮 Controller Pattern

**Always extract status from service response:**

```typescript
@Controller('api/v1/features')
export class FeatureController {
  constructor(private readonly featureService: FeatureService) {}

  @Post()
  async createFeature(
    @Body() body: CreateFeatureDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.featureService.createFeature(body);
    return res.status(status).json(restOfResponse);
  }

  @Get()
  async getFeatures(
    @Query() filter: FeatureFilterDto,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.featureService.getFeatures(filter);
    return res.status(status).json(restOfResponse);
  }

  @Get(':id')
  async getFeatureById(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { status, ...restOfResponse } = await this.featureService.getFeatureById(parseInt(id));
    return res.status(status).json(restOfResponse);
  }
}
```

### 5. 🗄️ Repository Pattern

**Use Prisma with custom repository classes:**

```typescript
import prisma from '../common/prisma';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class FeatureRepository {
  async create(data: CreateFeatureData): Promise<any> {
    return await prisma.feature.create({
      data,
      include: {
        relatedEntity: true,
      },
    });
  }

  async findWithPagination(filter: FeatureFilter): Promise<any> {
    const { offset, limit, keyword, status } = filter;

    const whereClause = Prisma.sql`
      WHERE (
        F.name::text ILIKE CONCAT('%', ${keyword}::text, '%') 
        OR COALESCE(${keyword}, NULL) IS NULL
      )
      AND (F.status::text = ${status} OR COALESCE(NULLIF(${status}, ''), NULL) IS NULL)
    `;

    const query = Prisma.sql`
      SELECT 
        F.id,
        F.name,
        F.status,
        F.created_at
      FROM feature F 
      ${whereClause} 
      ORDER BY F.created_at DESC 
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    const countQuery = Prisma.sql`
      SELECT COUNT(*)::int 
      FROM feature F 
      ${whereClause}
    `;

    const data: any[] = await prisma.$queryRaw(query);
    const [{ count }]: { count: number }[] = await prisma.$queryRaw(countQuery);

    return {
      data,
      meta: {
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
      },
    };
  }

  async updateWithTransaction(id: number, updateData: any): Promise<any> {
    return await prisma.$transaction(async (prismaClient: PrismaClient) => {
      const updated = await prismaClient.feature.update({
        where: { id },
        data: updateData,
      });

      // Additional related operations
      await prismaClient.featureHistory.create({
        data: {
          featureId: id,
          action: 'updated',
          timestamp: new Date(),
        },
      });

      return updated;
    });
  }
}
```

### 6. 🔄 Queue/Job Pattern

**Use Bull queues with decorators:**

```typescript
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';

@Processor('PROCESS_FEATURE_QUEUE')
export class FeatureQueueProcessor {
  private readonly logger = new Logger(FeatureQueueProcessor.name);

  constructor(
    private readonly repository: FeatureRepository,
    @InjectQueue('ANOTHER_QUEUE') private readonly anotherQueue: Queue,
  ) {}

  @Process()
  async handleJob(job: Job<any>) {
    try {
      this.logger.log('Processing feature job item');

      const jobData = job.data;

      // Process the job
      const result = await this.repository.processFeature(jobData);

      // Chain to another queue if needed
      await this.anotherQueue.add('next-step', { result });

      this.logger.log(`Feature job completed: ${jobData.id}`);
    } catch (error) {
      this.logger.error(`Failed to process feature job: ${error}`);
      throw error; // Let Bull handle retries
    }
  }
}
```

### 7. ⚠️ Error Handling Pattern

**Use consistent utility functions:**

```typescript
import { throwError, generateErrorResponse, generateSuccessResponse } from '../../utils/util';
import { logError, logInfoMessage } from '../../utils/logger';

// In validators
if (validationFailed) {
  throwError('Validation error message', HttpStatus.BAD_REQUEST);
}

// In services
try {
  // logic
} catch (error) {
  const errorMessage = `Descriptive error context ==> ${error}`;
  logError(errorMessage);
  return generateErrorResponse(error);
}

// Success responses
return generateSuccessResponse({
  statusCode: HttpStatus.OK,
  message: Constants.successMessage,
  data: result,
  meta: pagination,
});
```

### 8. 📊 Constants & Enums

**Store all enums in `src/common/enums/generic.enum.ts`:**

```typescript
export enum TransactionStatus {
  pending = 'pending',
  complete = 'complete',
  failed = 'failed',
  cancelled = 'cancelled',
}

export enum UserType {
  customer = 'customer',
  merchant = 'merchant',
  admin = 'admin',
}

export enum TransactionType {
  cashIn = 'cash_in',
  cashOut = 'cash_out',
  transfer = 'transfer',
  payment = 'payment',
}

export const Constants = {
  successMessage: 'Operation completed successfully',
  errorMessage: 'An error occurred',
  unauthorizedMessage: 'Unauthorized access',
};
```

**Store queue names in `src/common/constants/queues.constant.ts`:**

```typescript
export const PROCESS_FEATURE_QUEUE = 'process-feature-queue';
export const PROCESS_NOTIFICATION_QUEUE = 'process-notification-queue';
export const PROCESS_EMAIL_QUEUE = 'process-email-queue';
```

### 9. ⚙️ Configuration Pattern

**Centralized config in `src/config/config.ts`:**

```typescript
export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL,
  
  // Authentication
  jwtSecret: process.env.JWT_SECRET,
  tokenExpiration: process.env.TOKEN_EXPIRATION || '24h',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '30d',
  
  // Queue settings
  redisUrl: process.env.REDIS_URL,
  queueRetryAttempts: parseInt(process.env.QUEUE_RETRY_ATTEMPTS) || 3,
  
  // External services
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL,
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL,
  
  // Business logic
  defaultCurrency: 'USD',
  maxTransactionAmount: 10000,
  
  // Feature flags
  enableNewFeature: process.env.ENABLE_NEW_FEATURE === 'true',
};
```

### 10. 📥 Import Conventions

```typescript
// External libraries first
import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as Joi from 'joi';

// Internal modules (relative imports)
import { FeatureRepository } from '../../repositories/feature.repository';
import { Constants } from '../../common/enums/generic.enum';
import { generateSuccessResponse } from '../../utils/util';
import { config } from '../../config/config';

// Relative imports within the same module
import { CreateFeatureDto } from './dto/feature.dto';
import { FeatureValidator } from './feature.validator';
```

### 11. 🏷️ Naming Conventions

- **Files:** `kebab-case.ts` or `camelCase.ts`
- **Classes:** `PascalCase`
- **Variables/functions:** `camelCase`
- **Constants:** `UPPER_SNAKE_CASE`
- **Database fields:** `snake_case` in Prisma schema, `camelCase` in TypeScript
- **Queue names:** `UPPER_SNAKE_CASE` with descriptive prefixes
- **Enum values:** `snake_case` for database compatibility
- **Imports:** Always use relative paths (e.g., `../../utils/util`, `./dto/feature.dto`)

### 12. 🗃️ Database Patterns

**Prisma Schema Conventions:**

```prisma
model Feature {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  status      FeatureStatus @default(active)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  created_by  Int?
  updated_by  Int?

  // Relations
  user        User?    @relation(fields: [created_by], references: [id])
  
  @@map("feature")
}

enum FeatureStatus {
  active
  inactive
  pending
  archived
  
  @@map("feature_status")
}
```

**Transaction Usage:**

```typescript
// Use transactions for operations affecting multiple tables
return await prisma.$transaction(async (prismaClient: PrismaClient) => {
  const created = await prismaClient.feature.create({ data });
  
  await prismaClient.featureHistory.create({
    data: {
      featureId: created.id,
      action: 'created',
      userId: currentUserId,
    },
  });
  
  return created;
});
```

### 13. 📤 Response Formatting

**Standardized response structure:**

```typescript
// Success Response
{
  statusCode: 200,
  message: "Operation completed successfully",
  data: {
    // Response data
  },
  meta?: {
    total: 100,
    page: 1,
    limit: 10,
    totalPages: 10
  }
}

// Error Response
{
  statusCode: 400,
  message: "Validation error",
  error: "Detailed error message"
}
```

### 14. 🌍 Internationalization

**Store translations in `src/i18n/[language]/`:**

```json
// src/i18n/en/messages.json
{
  "success": {
    "created": "Item created successfully",
    "updated": "Item updated successfully",
    "deleted": "Item deleted successfully"
  },
  "errors": {
    "notFound": "Item not found",
    "unauthorized": "Unauthorized access",
    "validationFailed": "Validation failed"
  }
}
```

### 15. 🔒 Security Practices

- **Authentication middleware** for protected routes
- **Input validation** with Joi for all endpoints
- **Proper HTTP status codes** for all responses
- **Error logging** without exposing sensitive information
- **Rate limiting** for public endpoints
- **CORS configuration** for cross-origin requests

### 16. 📋 Module Structure

**Each feature module should follow this pattern:**

```typescript
@Module({
  imports: [
    RepositoriesModule,
    QueueProducersModule,
    // Other required modules
  ],
  controllers: [FeatureController],
  providers: [
    FeatureService,
    FeatureValidator,
    // Other providers
  ],
  exports: [FeatureService], // Export if used by other modules
})
export class FeatureModule {}
```

### 17. 🧪 Testing Conventions

- **Unit tests:** Place alongside source files with `.spec.ts` extension
- **Integration tests:** Place in `tests/` directory
- **Test naming:** `describe('FeatureName')` and `it('should do something')`
- **Mock external dependencies** in unit tests
- **Use real database** for integration tests (with cleanup)

## 🏗️ Core Architecture Components

### 18. 🗄️ Prisma Setup & Database Connection

**The `prisma` instance used in repositories comes from `src/common/prisma.ts`:**

```typescript
// src/common/prisma.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

export default prisma;
```

**How repositories use it:**

```typescript
// In any repository file
import prisma from '../common/prisma';

@Injectable()
export class FeatureRepository {
  async findAll() {
    return await prisma.feature.findMany();
  }
}
```

**Key Points:**
- **Single instance:** All repositories import the same prisma instance
- **Centralized configuration:** Database connection settings in one place
- **Logging enabled:** Track queries and errors
- **Auto-generated types:** Prisma generates TypeScript types from schema

### 19. 🔄 Queue Module Architecture

**Queue system is split into two main modules:**

#### **Queue Producers Module** (`src/queues/queue-producers.module.ts`):
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import {
  PROCESS_FEATURE_QUEUE,
  PROCESS_NOTIFICATION_QUEUE,
  PROCESS_EMAIL_QUEUE,
} from '../common/constants/queues.constant';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PROCESS_FEATURE_QUEUE },
      { name: PROCESS_NOTIFICATION_QUEUE },
      { name: PROCESS_EMAIL_QUEUE },
    ),
  ],
  exports: [BullModule], // Export for other modules to inject queues
})
export class QueueProducersModule {}
```

#### **Queue Processors Module** (`src/queues/queue-processors.module.ts`):
```typescript
import { Module } from '@nestjs/common';
import { FeatureQueueProcessor } from './processors/feature.processor';
import { NotificationQueueProcessor } from './processors/notification.processor';
import { EmailQueueProcessor } from './processors/email.processor';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    RepositoriesModule, // Processors need access to repositories
    QueueProducersModule, // Processors might need to enqueue other jobs
  ],
  providers: [
    FeatureQueueProcessor,
    NotificationQueueProcessor,
    EmailQueueProcessor,
  ],
})
export class QueueProcessorsModule {}
```

#### **How Services Use Queues:**
```typescript
// In feature.service.ts
@Injectable()
export class FeatureService {
  constructor(
    @InjectQueue(PROCESS_FEATURE_QUEUE) private readonly featureQueue: Queue,
    @InjectQueue(PROCESS_NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  async createFeature(data: CreateFeatureDto) {
    // Create the feature
    const feature = await this.repository.create(data);
    
    // Enqueue background processing
    await this.featureQueue.add('process-feature', { id: feature.id });
    
    // Enqueue notification
    await this.notificationQueue.add('send-notification', {
      userId: data.userId,
      type: 'feature-created',
    });
  }
}
```

#### **Queue Constants** (`src/common/constants/queues.constant.ts`):
```typescript
// Define all queue names here
export const PROCESS_FEATURE_QUEUE = 'process-feature-queue';
export const PROCESS_NOTIFICATION_QUEUE = 'process-notification-queue';
export const PROCESS_EMAIL_QUEUE = 'process-email-queue';
export const PROCESS_CASH_IN_PAYMENT_QUEUE = 'process-cash-in-payment-queue';
export const PROCESS_ADD_FUNDS_TO_ACCOUNT_QUEUE = 'process-add-funds-to-account-queue';
```

### 20. 🔐 API Client Pattern & Authentication

**API Client Entity** (`src/common/entities/api-key-client.entity.ts`):
```typescript
export class ApiKeyClient {
  id: number;
  apiKey: string;
  applicationId: number;
  application: {
    id: number;
    name: string;
    partnerId: number;
    webhookUrl?: string;
    environment: 'sandbox' | 'production';
  };
  isActive: boolean;
  lastUsedAt?: Date;
}
```

**API Key Middleware** (`src/common/middlewares/api-key.middleware.ts`):
```typescript
@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly apiKeyRepository: ApiKeyRepository) {}

  async use(req: any, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    const apiKeyClient = await this.apiKeyRepository.validateApiKey(apiKey);
    
    if (!apiKeyClient || !apiKeyClient.isActive) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Attach to request for use in controllers
    req.apiKeyClient = apiKeyClient;
    
    // Update last used timestamp
    await this.apiKeyRepository.updateLastUsed(apiKeyClient.id);
    
    next();
  }
}
```

**How Controllers Use API Client:**
```typescript
@Controller('api/v1/payments')
export class PaymentsController {
  @Post('initiate')
  async initiatePayment(
    @Body() body: InitiatePaymentDto,
    @Req() request: any, // Contains apiKeyClient
    @Res() res: Response,
  ) {
    const apiKeyClient: ApiKeyClient = request.apiKeyClient;
    const { status, ...response } = await this.paymentsService.initiatePayment(
      apiKeyClient,
      body,
    );
    return res.status(status).json(response);
  }
}
```

### 21. 🏢 B2B/Merchant Architecture

**Merchant-specific modules follow partner-first organization:**

```
src/apis/merchant/
├── auth/              # Merchant authentication
├── registration/      # Partner onboarding
├── applications/      # API key management
├── payments/          # Merchant-initiated payments
├── disbursements/     # Fund disbursements
└── webhooks/          # Webhook management
```

**B2B Repositories** (`src/repositories/b2b/`):
```typescript
// src/repositories/b2b/partners.repository.ts
@Injectable()
export class PartnerRepository {
  async createPartner(data: CreatePartnerData) {
    return await prisma.b2bPartner.create({ data });
  }

  async getPartnerByEmail(email: string) {
    return await prisma.b2bPartner.findUnique({
      where: { contactEmail: email },
      include: {
        applications: true,
        accounts: true,
      },
    });
  }
}
```

### 22. 🌐 External Service Integration Pattern

**Helper Functions for External APIs** (`src/helpers/`):
```typescript
// src/helpers/payment-ms.ts
import { config } from '../config/config';

export async function initiateCashIn(params: CashInParams) {
  const response = await fetch(`${config.paymentServiceUrl}/cash-in`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': params.authorizationToken,
    },
    body: JSON.stringify(params),
  });

  return await response.json();
}

// src/helpers/mfa-ms.ts
export async function sendOtpCode(params: OtpParams) {
  const response = await fetch(`${config.mfaServiceUrl}/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  return await response.json();
}
```

### 23. 📊 Repository Module Structure

**Centralized Repository Module** (`src/repositories/repositories.module.ts`):
```typescript
@Module({
  providers: [
    // Core repositories
    CustomerRepository,
    AccountRepository,
    TransactionRepository,
    
    // B2B repositories
    PartnerRepository,
    B2BAccountRepository,
    
    // Supporting repositories
    StatisticsRepository,
    WebhookEventRepository,
    
    // Feature-specific repositories
    PaymentRepository,
    DisbursementRepository,
  ],
  exports: [
    // Export all repositories for use in other modules
    CustomerRepository,
    AccountRepository,
    TransactionRepository,
    PartnerRepository,
    B2BAccountRepository,
    StatisticsRepository,
    WebhookEventRepository,
    PaymentRepository,
    DisbursementRepository,
  ],
})
export class RepositoriesModule {}
```

### 24. ⚙️ Configuration & Environment Management

**Centralized Configuration** (`src/config/config.ts`):
```typescript
export const config = {
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  
  // Authentication & Security
  authJWTSecret: process.env.AUTH_JWT_SECRET!,
  authRefreshJWTSecret: process.env.AUTH_REFRESH_JWT_SECRET!,
  tokenExpiration: process.env.TOKEN_EXPIRATION || '24h',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '30d',
  tokenExpirationInSeconds: 24 * 60 * 60, // 24 hours
  refreshTokenExpirationInSeconds: 30 * 24 * 60 * 60, // 30 days
  
  // External Microservices
  paymentServiceUrl: process.env.PAYMENT_SERVICE_URL!,
  mfaServiceUrl: process.env.MFA_SERVICE_URL!,
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL!,
  
  // Queue Configuration
  redisUrl: process.env.REDIS_URL!,
  paymentStatusCheckerTTL: 30 * 60 * 1000, // 30 minutes
  paymentStatusCheckerRepeatInterval: 2 * 60 * 1000, // 2 minutes
  
  // Business Logic
  defaultAccountCurrency: 'USD',
  cashCoWalletAccountTypeName: 'CashCo Wallet',
  fiatWalletCryptoTokenId: process.env.FIAT_WALLET_CRYPTO_TOKEN_ID!,
  cashCoWalletCryptoTokenId: process.env.CASHCO_WALLET_CRYPTO_TOKEN_ID!,
  
  // Fee Configuration
  fees: {
    paymentFees: [
      { min: 0, max: 100, fee: 2.5 },
      { min: 100, max: 1000, fee: 3.0 },
    ],
    disbursementFees: [
      { min: 0, max: 100, fee: 1.5 },
      { min: 100, max: 1000, fee: 2.0 },
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
  
  // Email Verification
  emailVerificationTokenExpirationInMilliseconds: 30 * 60 * 1000, // 30 minutes
};
```

### 25. 🔄 Job Processing Flow Architecture

**How jobs flow through the system:**

1. **Service enqueues job** → Queue Producer
2. **Queue Processor picks up job** → Processes business logic
3. **Processor may enqueue follow-up jobs** → Chain processing
4. **Failed jobs are retried** → Bull handles retries automatically

**Example Job Flow for Cash-In:**
```
User Request → TransactionsService.confirmDeposit()
    ↓
Creates Transaction (pending status)
    ↓
Enqueues: PROCESS_CASH_IN_PAYMENT_QUEUE
    ↓
CashInPaymentsQueueProcessor.handleJob()
    ↓
Calls Payment Microservice
    ↓
Enqueues: PROCESS_CHECK_PAYMENT_STATUS_QUEUE (repeatable job)
    ↓
PaymentStatusQueueProcessor.handleJob() (runs every 2 minutes)
    ↓
If successful: Enqueues PROCESS_ADD_FUNDS_TO_ACCOUNT_QUEUE
    ↓
AddFundsToAccountQueueProcessor.handleJob()
    ↓
Updates account balance, transaction status → Complete
```

### 26. 🗂️ Entity Patterns & Relationships

**Repository Entity DTOs** (`src/repositories/entities/`):
```typescript
// src/repositories/entities/transaction-details.entity.ts
export interface CreateTransactionDetails {
  accountId: number;
  amount: Decimal;
  total?: Decimal;
  currency: Currency;
  status: TransactionStatus;
  type: TransactionType;
  reference: string;
  paymentOperator?: string;
  paymentProvider?: string;
  affectedTreasuryAccountType?: TreasuryAccountType;
  partnerApplicationId?: number;
  callbackUrl?: string;
}

export interface UpdateTransactionDetails {
  status?: TransactionStatus;
  blockchainStatus?: BlockchainStatus;
  blockchainHash?: string;
  paymentProvider?: string;
  paymentDetails?: any;
}
```

### 27. 🔧 Utility Functions & Helpers

**Core Utility Functions** (`src/utils/util.ts`):
```typescript
export function generateSuccessResponse(data: {
  statusCode: number;
  message: string;
  data?: any;
  meta?: any;
}) {
  return {
    status: data.statusCode,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
  };
}

export function generateErrorResponse(error: any) {
  return {
    status: error.statusCode || 500,
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal server error',
    error: error.message,
  };
}

export function throwError(message: string, statusCode: number) {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  throw error;
}
```

**Joi Validation Helper** (`src/utils/joi.validator.ts`):
```typescript
import * as Joi from 'joi';

export function validateJoiSchema(schema: Joi.ObjectSchema, data: any): string | null {
  const { error } = schema.validate(data);
  return error ? error.details[0].message : null;
}
```

**Logger Utility** (`src/utils/logger.ts`):
```typescript
export function logError(message: string) {
  console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
}

export function logInfoMessage(message: string) {
  console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
}
```

### 28. 🔗 Blockchain Integration Pattern

**Blockchain Client** (`src/blockchain/starknet-client/`):
```typescript
// src/blockchain/starknet-client/starknet-client.service.ts
@Injectable()
export class StarknetClientService {
  async credit(params: CreditParams) {
    // Blockchain credit operation
    return transactionHash;
  }

  async debit(params: DebitParams) {
    // Blockchain debit operation
    return transactionHash;
  }
}
```

**How services integrate with blockchain:**
```typescript
// In transaction processor
await this.processCreateBlockchainTransactionQueue.add({
  ...transactionDetails,
  customer: customerData,
});

// Blockchain processor creates transaction on chain
// Then updates database with blockchain hash and status
```

### 29. 🔔 Webhook Event System

**Webhook Event Processing** (`src/apis/webhook/`):
```typescript
// Webhook events are enqueued for reliable delivery
await this.processWebhookEventQueue.add({
  transactionId: transaction.id,
  eventType: 'payment.initiated',
  callbackUrl: webhookUrl,
  payload: eventData,
  status: 'pending',
});

// Processor attempts delivery with retries
@Processor('PROCESS_WEBHOOK_EVENT_QUEUE')
export class WebhookEventProcessor {
  @Process()
  async handleWebhook(job: Job<WebhookEventData>) {
    // Attempt to deliver webhook
    // Update status based on response
    // Retry on failure
  }
}
```

### 30. 📈 Treasury Management Integration

**Treasury Account Updates** (in repository transactions):
```typescript
// When processing transactions, update treasury accounts
await prismaClient.treasuryAccount.upsert({
  where: {
    accountName_isSystemDefined_type_fundsNature: {
      accountName: transaction.paymentProvider,
      isSystemDefined: true,
      type: TreasuryAccountType.psp,
      fundsNature: FundsNatureType.incoming_funds,
    },
  },
  update: {
    balance: { increment: transaction.amount },
  },
  create: {
    accountName: transaction.paymentProvider,
    balance: transaction.amount,
    type: TreasuryAccountType.psp,
    fundsNature: FundsNatureType.incoming_funds,
    // ... other fields
  },
});
```

## 📋 Quick Reference Checklist

When creating a new feature, ensure you have:

### Core Components:
- [ ] **Controller** with proper response handling (`{ status, ...rest }` pattern)
- [ ] **Service** with try-catch and response formatting
- [ ] **Validator** using Joi schemas (NO class-validator)
- [ ] **Repository** with Prisma integration (import from `../common/prisma` or appropriate relative path)
- [ ] **DTOs** as plain TypeScript classes
- [ ] **Module** with proper imports/exports

### Architecture Integration:
- [ ] **Constants/Enums** added to common files
- [ ] **Error handling** with utility functions
- [ ] **Queue producers/processors** if background jobs needed
- [ ] **API client pattern** for external authentication (if B2B)
- [ ] **Webhook events** for external notifications (if applicable)
- [ ] **Treasury account updates** for financial transactions
- [ ] **Blockchain integration** for wallet operations (if applicable)

### Quality Assurance:
- [ ] **Tests** for critical functionality
- [ ] **Proper logging** with context
- [ ] **Configuration** added to central config file
- [ ] **Documentation** updated

## 🎯 Key Principles to Remember

1. **Feature-first organization** - Group by business domain, not technical layer
2. **Joi validation** - Never use class-validator decorators
3. **Consistent error handling** - Always use utility functions
4. **Repository pattern** - Abstract database operations
5. **Queue-based processing** - For async/heavy operations
6. **Standardized responses** - Consistent API response structure
7. **Configuration centralization** - All config in one place
8. **Type safety** - Leverage TypeScript fully
9. **Transaction management** - Use Prisma transactions appropriately
10. **Security first** - Validate everything, log appropriately

---

*This guide should be referenced for all new projects to maintain consistency and best practices.* 