## ✅ Task 1 – Backend Modernization (Bug-Fixed Version)

## 📋 Table of Contents

- [Goal](#-goal)
- [Technologies Used](#%EF%B8%8F-technologies-used)
- [API Endpoints](#-api-endpoints)
- [Architecture Decisions](#%EF%B8%8F-architecture-decisions)
- [Implementation Details](#-implementation-details)
- [Legacy Bugs Fixed](#-legacy-bugs-fixed)
- [Time Estimation](#%EF%B8%8F-time-estimation)
- [Key Assumptions](#-key-assumptions--decisions)
- [Final Notes](#-final-notes)

### 🎯 Goal

Refactor legacy Express endpoints `/legacy/memberships` (GET & POST) into a modern, maintainable NestJS backend using TypeScript, with:

- Separation of concerns
- Type safety
- Declarative validation
- **Fixed validation logic** that addresses legacy bugs while maintaining API structure

### 🛠️ Technologies Used

- **NestJS** – Modern, modular Node.js framework with built-in TypeScript support
- **TypeScript** – Static typing and enhanced developer experience
- **class-validator** – Declarative validation decorators
- **uuid** – Unique identifier generation
- **Mock JSON Files** – In-memory data storage (matching legacy behavior)

### 📌 API Endpoints

#### **POST** `/memberships`

Creates a new membership and auto-generates billing periods based on business rules.

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
    "state": "active",
    "validFrom": "2024-07-01T00:00:00.000Z",
    "validUntil": "2025-01-01T00:00:00.000Z",
    "userId": 2000,
    "paymentMethod": "credit card",
    "recurringPrice": 60,
    "billingPeriods": 6,
    "billingInterval": "monthly"
  },
  "membershipPeriods": [
    {
      "id": 4,
      "uuid": "06e4a745-80e1-4144-bff7-e377966a2d63",
      "membership": 4,
      "start": "2024-07-01T00:00:00.000Z",
      "end": "2024-08-01T00:00:00.000Z",
      "state": "issued"
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
    "membership": {},
    "periods": []
  }
]
```

### 🏗️ Architecture Decisions

#### **1. Service-Controller Pattern**

- **Decision**: Separated HTTP handling (Controller) from business logic (Service)
- **Benefits**:
  - Follows NestJS best practices and SOLID principles
  - Improves testability - services can be unit tested independently
  - Enables business logic reuse across different controllers
  - Clear separation of concerns

#### **2. Module-Based Architecture**

- **Implementation**: Created `MembershipsModule` encapsulating all membership functionality
- **Benefits**:
  - Leverages NestJS dependency injection
  - Promotes feature isolation and modularity
  - Facilitates future microservice extraction
  - Clear feature boundaries

#### **3. Declarative Validation Strategy**

- **Decision**: Replaced imperative validation with `class-validator` decorators
- **Implementation**:
  ```typescript
  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsString({ message: 'nameMustBeAString' })
  name: string;
  ```
- **Benefits**:
  - Cleaner, more maintainable code
  - Automatic validation via `ValidationPipe`
  - Centralized validation logic in DTOs
  - Type transformation included

#### **4. Custom Validators for Business Rules**

- **Created Custom Validators**:
  - `CashPriceLimitConstraint`: Validates cash payments don't exceed 100
  - `ValidateBillingPeriodsConstraint`: Validates billing periods based on interval with proper logic
- **Rationale**: Complex conditional validations require custom logic
- **Example**:
  ```typescript
  @ValidatorConstraint({ name: 'cashPriceLimit', async: false })
  export class CashPriceLimitConstraint
    implements ValidatorConstraintInterface
  {
    validate(recurringPrice: number, args: ValidationArguments) {
      const object = args.object as CreateMembershipDto;
      return !(object.paymentMethod === 'cash' && recurringPrice > 100);
    }
  }
  ```

#### **5. Improved Error Messages**

- **Enhanced Validation**: Added descriptive error messages for better developer experience
- **Proper Field Validation**: All fields have appropriate validation with clear error messages
- **Examples**:
  - `nameMustBeAString` instead of generic errors
  - `recurringPriceMustBeANumber` for type validation
  - `invalidBillingInterval` instead of misleading "invalidBillingPeriods"
  - `weeklyBillingCannotExceed6Months` for weekly-specific validation

### 📝 Implementation Details

#### **Improved Validation Logic**:

1. **All mandatory fields properly validated** with `@IsNotEmpty()`
2. **Payment method validation** with enum constraint
3. **Billing interval validation** with proper error message
4. **Billing periods validation** that:
   - Monthly: 6-12 periods (fixed the typo bug)
   - Yearly: 1-10 periods
   - Weekly: 1-26 periods (6 months maximum)
5. **Type-specific error messages** for better debugging

#### **ValidationPipe Usage**

The modernized codebase uses NestJS's `ValidationPipe` for automatic validation:

```typescript
@Post()
create(@Body(ValidationPipe) createMembershipDto: CreateMembershipDto)
```

This single decorator replaces many lines of manual validation while providing:

- Automatic constraint validation
- Type transformation (JSON → DTO instance)
- Structured error responses
- Clean controller code

#### **Data Management Decisions**

- **In-Memory Storage**: Maintained to match legacy behavior
- **Type-Safe Conversions**: Created functions to handle JSON date strings
- **ID Generation Fix**: Uses `Math.max()` instead of array length to prevent conflicts

### 🐛 Legacy Bugs Fixed

This branch addresses all the validation bugs found in the legacy system:

#### **1. Fixed Monthly Billing Periods Validation**

- **Legacy Bug**: Typo prevented validation of periods < 6 months
- **Fix**: Properly validates that monthly memberships require 6-12 billing periods
- **Implementation**: `billingPeriods >= 6 && billingPeriods <= 12`

#### **2. Proper Yearly Billing Periods Validation**

- **Legacy Bug**: Confusing error messages for yearly periods > 3
- **Fix**: Clear validation with proper error messages
- **Implementation**: Allows 1-10 yearly periods with accurate error messages

#### **3. Weekly Billing Interval Now Supported**

- **Legacy Bug**: Weekly was rejected by the else clause despite being valid
- **Fix**: Weekly is now a valid billing interval with proper validation (max 26 weeks)
- **Implementation**: Added weekly-specific validation logic

#### **4. Correct Error Messages for Invalid Billing Intervals**

- **Legacy Bug**: Invalid intervals returned "invalidBillingPeriods"
- **Fix**: Returns proper "invalidBillingInterval" message
- **Implementation**: `@IsEnum` validator with appropriate error message

#### **5. Payment Method Validation Added**

- **Legacy Bug**: No validation for payment method field
- **Fix**: Validates payment method is either 'cash' or 'credit card'
- **Implementation**: `@IsEnum(['cash', 'credit card'])`

#### **6. All Required Fields Properly Validated**

- **Legacy Bug**: Missing fields could cause runtime errors
- **Fix**: All required fields have `@IsNotEmpty()` validation
- **Implementation**: Comprehensive validation on all DTO fields

### 🤔 Key Assumptions & Decisions

#### **Assumptions**

- Mock JSON data simulates persistent storage (no external DB)
- Data loss on server restart is acceptable (matches legacy behavior)
- User authentication not implemented (hardcoded `userId: 2000`)
- Response structures must match legacy API for compatibility
- **Validation logic should be correct and user-friendly**

#### **Major Decisions**

1. **In-Memory Storage**: Maintained to match legacy behavior and avoid scope creep
2. **Fixed Validation Logic**: Corrected all legacy validation bugs for better UX
3. **Proper Error Messages**: Added descriptive error messages for all validation failures
4. **Weekly Support**: Enabled weekly billing intervals with appropriate validation
5. **Type Safety**: Added comprehensive TypeScript interfaces with proper validation

The refactored codebase provides a clean, bug-free implementation while maintaining API compatibility.

## 📦 Final Notes

This modernization demonstrates:

- **Clean Architecture**: Clear separation of concerns with NestJS patterns
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Improved Validation**: Fixed all legacy bugs for better user experience
- **Maintainability**: Declarative validation and modular structure
- **Future-Ready**: Architecture supports easy database integration
