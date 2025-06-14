## ✅ Task 1 – Backend Modernization

## 📋 Table of Contents

- [Goal](#-goal)
- [Technologies Used](#%EF%B8%8F-technologies-used)
- [API Endpoints](#-api-endpoints)
- [Architecture Decisions](#%EF%B8%8F-architecture-decisions)
- [Implementation Details](#-implementation-details)
- [Intentionally Preserved Legacy Bugs](#-intentionally-preserved-legacy-bugs)
- [Time Estimation](#%EF%B8%8F-time-estimation)
- [Key Assumptions](#-key-assumptions--decisions)
- [Final Notes](#-final-notes)

### 🎯 Goal

Refactor legacy Express endpoints `/legacy/memberships` (GET & POST) into a modern, maintainable NestJS backend using TypeScript, with:

- Separation of concerns
- Type safety
- Declarative validation
- **100% backward compatibility** with existing API contracts

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
  @IsString({ message: 'missingMandatoryFields' })
  name: string;
  ```
- **Benefits**:
  - Cleaner, more maintainable code
  - Automatic validation via `ValidationPipe`
  - Centralized validation logic in DTOs
  - Type transformation included

#### **4. Custom Validators for Business Rules**

- **Created Two Custom Validators**:
  - `CashPriceLimitConstraint`: Validates cash payments don't exceed 100
  - `BillingPeriodsRangeConstraint`: Validates billing periods based on interval
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

#### **5. Legacy Error Format Compatibility**

- **Challenge**: NestJS returns different error structure than legacy API
- **Solution**: Created `LegacyValidationExceptionFilter` to transform errors
- **Implementation**:
  ```typescript
  @Controller('memberships')
  @UseFilters(new LegacyValidationExceptionFilter())
  export class MembershipsController { ... }
  ```
- **Features**:
  - Transforms NestJS validation errors to legacy format
  - Respects legacy error priority order
  - Handles both string and object error responses
  - Returns single error code (matching legacy behavior)

### 📝 Implementation Details

#### **Error Priority Order** (matching legacy if-else chain):

1. `missingMandatoryFields`
2. `negativeRecurringPrice`
3. `cashPriceBelow100`
4. `billingPeriodsMoreThan12Months`
5. `billingPeriodsLessThan6Months`
6. `billingPeriodsMoreThan10Years`
7. `billingPeriodsLessThan3Years`
8. `invalidBillingPeriods`

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

#### **Preserved Legacy Behaviors**

- Error message inconsistencies (e.g., "billingPeriodsLessThan3Years" when checking >3)
- In-memory data loss on restart
- Hardcoded `userId: 2000`
- Exact response structures

### 🐛 Intentionally Preserved Legacy Bugs

To maintain exactly the same error messages as in the legacy code there bugs are **intentionally preserved** in the modernized codebase:

#### **1. Monthly Billing Periods < 6 Validation Never Executes**

- **Legacy Bug**: Typo in validation code uses `req.billingPeriods` instead of `req.body.billingPeriods`
- **Effect**: Monthly memberships can be created with 1-5 billing periods without error
- **Preserved In**: `BillingPeriodsRangeConstraint` - only validates upper bound (≤12)

```javascript
// Legacy code with bug:
if (req.billingPeriods < 6) {
  // Missing .body - this check never runs!
  return res.status(400).json({ message: 'billingPeriodsLessThan6Months' });
}
```

#### **2. Incorrect Error Message for Yearly Billing Periods 4-10**

- **Legacy Bug**: Returns "billingPeriodsLessThan3Years" for values 4-10 (should be "moreThan3Years")
- **Effect**: Users see semantically incorrect error message
- **Preserved In**: `BillingPeriodsRangeConstraint.defaultMessage()`

```javascript
// Legacy bug: says "less than" when value is actually "more than"
if (req.body.billingPeriods > 3) {
  if (req.body.billingPeriods > 10) {
    return { message: 'billingPeriodsMoreThan10Years' };
  } else {
    return { message: 'billingPeriodsLessThan3Years' }; // Wrong message!
  }
}
```

#### **3. Weekly Billing Interval Treated as Invalid**

- **Legacy Bug**: 'weekly' is valid for date calculations but validation else clause rejects it
- **Effect**: Cannot create weekly memberships via API despite backend support
- **Preserved In**: `BillingIntervalElseClauseConstraint` - treats 'weekly' as invalid

#### **4. Misleading Error for Invalid Billing Intervals**

- **Legacy Bug**: Returns "invalidBillingPeriods" instead of "invalidBillingInterval"
- **Effect**: Confusing error message when billing interval is the actual problem
- **Preserved In**: All billing interval validators return "invalidBillingPeriods"

#### **5. No Payment Method Validation**

- **Legacy Bug**: `paymentMethod` used in cash validation but never validated itself
- **Effect**: Any payment method value accepted (unless it's 'cash' with price > 100)
- **Preserved In**: No validation decorator on `paymentMethod` field

#### **6. Missing Field Validation Gaps**

- **Legacy Bug**: No explicit validation for required fields like `billingInterval` and `billingPeriods`
- **Effect**: Missing fields trigger generic else clause instead of specific errors
- **Preserved In**: Fields marked as required in DTO but rely on custom validators for errors

#### **Implementation Example**

```typescript
// Example of preserved bug in custom validator
@ValidatorConstraint({ name: 'billingPeriodsRange', async: false })
export class BillingPeriodsRangeConstraint {
  defaultMessage(args: ValidationArguments) {
    // ...
    case 'yearly':
      if (billingPeriods > 3) {
        // LEGACY BUG PRESERVED: Wrong message for 4-10 years
        return 'billingPeriodsLessThan3Years';
      }
  }
}
```

These bugs are documented with comments throughout the codebase to ensure future developers understand they are intentional, not oversights.

### ⏱️ Time Estimation

| Phase                      | Time          |
| :------------------------- | :------------ |
| Setup & Analysis           | ~30 mins      |
| Backend Implementation     | ~8:30 hrs     |
| Testing                    | ~30 mins      |
| **Initial Backend Total**  | **~9:30 hrs** |
| Frontend                   | 4 hrs         |
| GitHub Actions + Bug Fixes | 2 hrs         |
| Integration Testing        | 30 mins       |
| **Total Project Time**     | **~16 hrs**   |

### 🤔 Key Assumptions & Decisions

#### **Assumptions**

- Mock JSON data simulates persistent storage (no external DB)
- Data loss on server restart is acceptable (matches legacy behavior)
- User authentication not implemented (hardcoded `userId: 2000`)
- All legacy error messages must be preserved exactly, including inconsistencies
- Response structures must match legacy API 100% for backward compatibility

#### **Major Decisions**

1. **In-Memory Storage**: Maintained to match legacy behavior and avoid scope creep
2. **Error Message Bugs**: Preserved inconsistencies (e.g., "billingPeriodsLessThan3Years" when checking >3 years) for compatibility
3. **Validation Strategy**: Replaced many lines of imperative checks with declarative validators
4. **Exception Filter**: Created custom filter to transform NestJS errors to legacy format
5. **Type Safety**: Added comprehensive TypeScript interfaces while handling JSON date limitations

The refactored codebase maintains all legacy behaviors while providing a solid foundation for future enhancements.

## 📦 Final Notes

This modernization demonstrates:

- **Clean Architecture**: Clear separation of concerns with NestJS patterns
- **Type Safety**: Full TypeScript implementation with proper interfaces
- **Backward Compatibility**: 100% API compatibility with legacy endpoints
- **Maintainability**: Declarative validation and modular structure
- **Future-Ready**: Architecture supports easy database integration
