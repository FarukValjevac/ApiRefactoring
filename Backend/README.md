# Memberships API - NestJS Backend with PostgreSQL

## 📋 Table of Contents

- [Goal](#-goal)
- [Technologies Used](#%EF%B8%8F-technologies-used)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Database Setup](#-database-setup)
- [API Endpoints](#-api-endpoints)
- [Architecture Decisions](#%EF%B8%8F-architecture-decisions)
- [Implementation Details](#-implementation-details)
- [Validation Rules](#-validation-rules)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Key Assumptions](#-key-assumptions--decisions)
- [Future Enhancements](#-future-enhancements)

### 🎯 Goal

Modern NestJS backend for membership management with:

- **PostgreSQL database** with TypeORM integration
- **Docker containerization** for easy deployment
- **Type safety** with TypeScript
- **Declarative validation** using class-validator
- **Clean architecture** with separation of concerns
- **Automated billing period generation**

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

### 🚀 Installation

Default values work out of the box, but you can customize:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=memberships_db
```

### 🗄️ Database Setup

1. **Start PostgreSQL container**

   ```bash
   docker-compose up -d
   ```

2. **Verify container is running**

   ```bash
   docker-compose ps
   ```

3. **Database initialization**

   The database is automatically initialized with:

   - Schema creation (`src/init-db/sql-schema.sql`)
   - Seed data (`src/init-db/seed-data.sql`)

4. **Manual database initialization** (if needed)
   ```bash
    docker exec -i memberships-postgres psql -U postgres -d memberships_db < src/init-db/sql-shema.sql
    docker exec -i memberships-postgres psql -U postgres -d memberships_db < src/init-db/seed-data.sql
   ```

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

#### **3. Service-Repository Pattern**

- **Architecture**:
  ```
  Controller → Service → Repository → Database
  ```
- **Benefits**:
  - Clear separation of concerns
  - Database operations abstracted in repositories
  - Business logic isolated in services
  - Easy to mock for testing

#### **4. Entity-Interface Mapping**

- **Decision**: Separate database entities from API interfaces
- **Implementation**:
  ```typescript
  private toMembershipInterface(entity: MembershipEntity): Membership
  ```
- **Benefits**:
  - Decouples database schema from API contract
  - Flexibility to evolve database without breaking API
  - Type safety throughout the application

#### **5. Async/Await Pattern**

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

### 📝 Implementation Details

#### **Database Schema**

**Memberships Table:**

- `id` - Auto-incrementing primary key
- `uuid` - Unique identifier
- `name` - Membership name
- `user_id` - Associated user (hardcoded to 2000)
- `recurring_price` - Monthly/weekly/yearly price
- `valid_from` / `valid_until` - Membership validity period
- `state` - Current state (active/pending/expired)
- `payment_method` - Payment type
- `billing_interval` - Frequency of billing
- `billing_periods` - Number of periods
- `created_at` / `updated_at` - Timestamps

**Membership Periods Table:**

- `id` - Auto-incrementing primary key
- `uuid` - Unique identifier
- `membership_id` - Foreign key to memberships
- `start_date` / `end_date` - Period validity
- `state` - Period state (planned/issued)
- `created_at` / `updated_at` - Timestamps

#### **State Management**

Membership states are automatically calculated:

- **pending**: `validFrom` is in the future
- **active**: Current date is between `validFrom` and `validUntil`
- **expired**: `validUntil` is in the past

New periods are created with state `planned`.

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

- All new membership periods created with state 'planned'
- Membership state automatically calculated based on dates
- Payment method defaults to empty string if null in database

#### **Design Decisions**

1. **Database Over Files**: Chose PostgreSQL for data persistence and integrity
2. **Docker**: Containerized database for consistent environments
3. **TypeORM**: Selected for its NestJS integration and TypeScript support
4. **Validation**: Fixed legacy bugs while maintaining API structure
5. **Async Operations**: All database operations are asynchronous
6. **Entity Mapping**: Separate entities from interfaces for flexibility

---

The API is now ready at `http://localhost:3000` 🚀
