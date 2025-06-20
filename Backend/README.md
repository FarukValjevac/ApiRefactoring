# Memberships API - NestJS Backend with PostgreSQL

## 📋 Table of Contents

- [Goal](#-goal)
- [Technologies Used](#%EF%B8%8F-technologies-used)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#%EF%B8%8F-database-setup)
- [API Endpoints](#-api-endpoints)
- [Architecture Decisions](#%EF%B8%8F-architecture-decisions)
- [Implementation Details](#-implementation-details)
- [Validation Rules](#-validation-rules)
- [Environment Configuration](#-environment-configuration)
- [Key Assumptions](#-key-assumptions--decisions)

### 🎯 Goal

Modern NestJS backend for membership management with:

- **PostgreSQL database** with TypeORM integration
- **Docker containerization** for easy deployment
- **Type safety** with TypeScript
- **Declarative validation** using class-validator
- **Clean architecture** with separation of concerns
- **Automated billing period generation**
- **Membership lifecycle management** (create, terminate, delete)

### 🛠️ Technologies Used

- **NestJS 11** – Modern, modular Node.js framework
- **TypeScript** – Static typing and enhanced developer experience
- **PostgreSQL** – Relational database for persistent storage
- **TypeORM** – Object-Relational Mapping for database operations
- **Docker & Docker Compose** – Containerization and orchestration
- **class-validator** – Declarative validation decorators
- **uuid** – Unique identifier generation
- **@nestjs/config** – Environment variable management

### 📋 Prerequisites

- Node.js (v16 or higher)
- npm
- Docker and Docker Compose
- Git

### 📌 API Endpoints

#### **POST** `/memberships`

Creates a new membership and auto-generates billing periods.

**Request Body:**

```json
{
  "name": "Gold Plan",
  "recurringPrice": 60,
  "paymentMethod": "credit card",
  "billingInterval": "monthly",
  "billingPeriods": 6,
  "validFrom": "2024-07-01"
}
```

**Success Response (201):**

```json
{
  "membership": {
    "id": 4,
    "uuid": "192542ac-d300-415d-9626-852f3412c875",
    "name": "Gold Plan",
    "userId": 2000,
    "recurringPrice": 60,
    "validFrom": "2024-07-01T00:00:00.000Z",
    "validUntil": "2025-01-01T00:00:00.000Z",
    "state": "active",
    "paymentMethod": "credit card",
    "billingInterval": "monthly",
    "billingPeriods": 6
  },
  "membershipPeriods": [
    {
      "id": 4,
      "uuid": "06e4a745-80e1-4144-bff7-e377966a2d63",
      "membership": 4,
      "start": "2024-07-01T00:00:00.000Z",
      "end": "2024-08-01T00:00:00.000Z",
      "state": "planned"
    }
    // ... additional periods
  ]
}
```

**Error Response (400):**

```json
{
  "message": "billingPeriodsMoreThan12Months"
}
```

#### **GET** `/memberships`

Returns all memberships with their associated billing periods.

**Success Response (200):**

```json
[
  {
    "membership": {
      "id": 1,
      "uuid": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Platinum Plan",
      "userId": 2000,
      "recurringPrice": 150,
      "validFrom": "2023-01-01T00:00:00.000Z",
      "validUntil": "2023-12-31T00:00:00.000Z",
      "state": "expired",
      "paymentMethod": "credit card",
      "billingInterval": "monthly",
      "billingPeriods": 12
    },
    "periods": [
      {
        "id": 1,
        "uuid": "123e4567-e89b-12d3-a456-426614174000",
        "membership": 1,
        "start": "2023-01-01T00:00:00.000Z",
        "end": "2023-01-31T00:00:00.000Z",
        "state": "issued"
      }
    ]
  }
]
```

#### **POST** `/memberships/:id/terminate`

Terminates an active or pending membership by canceling all future billing periods.

**Path Parameters:**

- `id` (number) - The membership ID to terminate

**Business Rules:**

- Membership must be in `active` or `pending` state
- Cannot terminate if currently in the last billing period
- Must have remaining future periods to terminate
- All future periods will be marked as `terminated`
- Membership state will be set to `terminated`

**Success Response (200):**

```json
{
  "message": "Membership terminated successfully"
}
```

**Error Response (400):**

```json
{
  "message": "Termination not allowed: Membership must be active/pending and not in the last period"
}
```

**Example Use Cases:**

- ✅ **Allowed**: Active membership with 2+ remaining periods
- ✅ **Allowed**: Pending membership that hasn't started yet
- ✅ **Allowed**: 1 remaining period that hasn't started yet (future period)
- ❌ **Not Allowed**: Already expired membership
- ❌ **Not Allowed**: Currently in the final billing period (only 1 remaining period and you're in it)
- ❌ **Not Allowed**: Membership with no future periods

#### **DELETE** `/memberships/:id`

Permanently deletes a membership and all associated billing periods.

**Path Parameters:**

- `id` (number) - The membership ID to delete

**Important Notes:**

- This performs a **hard delete** - data cannot be recovered
- All associated membership periods are automatically deleted (CASCADE)
- Use with caution in production environments

**Success Response (200):**

```json
{
  "message": "Membership with ID 4 has been successfully deleted"
}
```

**Error Response (404):**

```json
{
  "message": "Membership with ID 999 not found"
}
```

### 🏗️ Architecture Decisions

#### **1. PostgreSQL with TypeORM**

- **Decision**: Migrated from in-memory JSON storage to PostgreSQL
- **Benefits**:
  - Data persistence across server restarts
  - ACID compliance and data integrity
  - Scalability and concurrent access
  - Rich querying capabilities
  - Foreign key constraints ensure referential integrity

#### **2. Docker Containerization**

- **Implementation**: PostgreSQL runs in Docker with automatic initialization
- **Benefits**:
  - Consistent development environment
  - Easy deployment and scaling
  - Automated database setup with init scripts
  - Volume persistence for data

#### **3. Entity-Interface Mapping**

- **Decision**: Separate database entities from API interfaces
- **Implementation**:
  ```typescript
  private toMembershipInterface(entity: MembershipEntity): Membership
  ```
- **Benefits**:
  - Decouples database schema from API contract
  - Flexibility to evolve database without breaking API
  - Type safety throughout the application

#### **4. Async/Await Pattern**

- **Implementation**: All database operations use async/await
- **Example**:
  ```typescript
  async createMembership(dto: CreateMembershipDto): Promise<{
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  }>
  ```
- **Benefits**:
  - Non-blocking I/O operations
  - Better performance under load
  - Clean error handling with try/catch

#### **5. Membership Lifecycle Management**

- **Decision**: Implement separate terminate and delete operations
- **Implementation**:
  - **Terminate**: Soft cancellation preserving historical data
  - **Delete**: Hard removal for complete cleanup
- **Benefits**:
  - Flexible membership management options
  - Data retention for terminated memberships
  - Complete cleanup capability when needed

### 📝 Implementation Details

#### **Database Schema**

**Memberships Table:**

- `id` - Auto-incrementing primary key
- `uuid` - Unique identifier
- `name` - Membership name
- `user_id` - Associated user (hardcoded to 2000)
- `recurring_price` - Monthly/weekly/yearly price
- `valid_from` / `valid_until` - Membership validity period
- `state` - Current state (active/pending/expired/terminated)
- `payment_method` - Payment type
- `billing_interval` - Frequency of billing
- `billing_periods` - Number of periods
- `created_at` / `updated_at` - Timestamps

**Membership Periods Table:**

- `id` - Auto-incrementing primary key
- `uuid` - Unique identifier
- `membership_id` - Foreign key to memberships
- `start_date` / `end_date` - Period validity
- `state` - Period state (pending/active/expired/terminated)
- `created_at` / `updated_at` - Timestamps

#### **State Management**

**Membership States:**

- **pending**: `validFrom` is in the future
- **active**: Current date is between `validFrom` and `validUntil`
- **expired**: `validUntil` is in the past
- **terminated**: Membership was cancelled before natural expiration

**Period States:**

- **pending**: Period hasn't started yet
- **active**: Current date is within the period
- **expired**: Period has ended naturally
- **terminated**: Period was cancelled before completion

#### **Termination Logic**

The termination process follows these business rules:

1. **State Validation**: Only `active` or `pending` memberships can be terminated
2. **Period Analysis**: Checks remaining future periods
3. **Last Period Protection**: Cannot terminate if currently in the final period
4. **Cascade Termination**: All future periods are marked as `terminated`
5. **Membership Update**: Main membership state becomes `terminated`

### ✅ Validation Rules

#### **Field Validations:**

1. **name**: Required, must be string
2. **recurringPrice**: Required, must be number ≥ 0
3. **paymentMethod**: Required, must be 'cash' or 'credit card'
4. **billingInterval**: Required, must be 'monthly', 'weekly', or 'yearly'
5. **billingPeriods**: Required, must be number ≥ 1
6. **validFrom**: Optional, must be valid date string

#### **Business Rule Validations:**

1. **Cash Payment Limit**: Cash payments cannot exceed 100
2. **Billing Period Constraints**:
   - **Monthly**: 6-12 periods
   - **Yearly**: 1-10 periods
   - **Weekly**: 1-26 periods (max 6 months)
3. **Termination Rules**:
   - Only active/pending memberships can be terminated
   - Cannot terminate while in the last billing period
   - Must have future periods to cancel

### 🔧 Environment Configuration

The application uses `@nestjs/config` for environment management:

```typescript
TypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'postgres'),
    password: configService.get('DB_PASSWORD', 'postgres'),
    database: configService.get('DB_DATABASE', 'memberships_db'),
    // ...
  }),
});
```

### 🤔 Key Assumptions & Decisions

#### **Assumptions**

- All new membership periods created with state 'pending'
- Membership state automatically calculated based on dates
- Payment method defaults to empty string if null in database
- Terminated memberships preserve historical data for auditing

#### **Design Decisions**

1. **Database Over Files**: Chose PostgreSQL for data persistence and integrity
2. **Docker**: Containerized database for consistent environments
3. **TypeORM**: Selected for its NestJS integration and TypeScript support
4. **Validation**: Fixed legacy bugs while maintaining API structure
5. **Async Operations**: All database operations are asynchronous
6. **Entity Mapping**: Separate entities from interfaces for flexibility
7. **Lifecycle Management**: Distinct terminate vs delete operations for flexibility
8. **Cascade Constraints**: Database-level CASCADE DELETE for data consistency

---

The API is now ready at `http://localhost:3000` 🚀

### 🔄 Common API Workflows

#### **Creating and Managing Memberships:**

1. **Create** → `POST /memberships`
2. **View All** → `GET /memberships`
3. **Cancel Early** → `POST /memberships/:id/terminate`
4. **Remove Completely** → `DELETE /memberships/:id`
