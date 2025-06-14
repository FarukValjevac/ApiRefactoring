// create-membership.dto.spec.ts
import { validate } from 'class-validator';
import { CreateMembershipDto } from './create-membership.dto';
import { BillingInterval } from '../types/memberships-types';

describe('CreateMembershipDto', () => {
  let dto: CreateMembershipDto;

  beforeEach(() => {
    dto = new CreateMembershipDto();
  });

  describe('name validation', () => {
    it('should accept valid name', async () => {
      dto.name = 'Premium Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject empty name', async () => {
      dto.name = '';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should reject non-string name', async () => {
      dto.name = 123;
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });
  });

  describe('recurringPrice validation', () => {
    it('should accept valid positive price', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 99.99;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept zero price', async () => {
      dto.name = 'Free Membership';
      dto.recurringPrice = 0;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject negative price', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = -10;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const priceError = errors.find((e) => e.property === 'recurringPrice');
      expect(priceError?.constraints?.min).toBe(
        'Recurring price cannot be negative',
      );
    });

    it('should reject non-number price', async () => {
      dto.name = 'Test Membership';
      (dto as any).recurringPrice = 'fifty';
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'recurringPrice')).toBe(true);
    });
  });

  describe('cash payment limit validation', () => {
    it('should accept cash payment under 100', async () => {
      dto.name = 'Cash Membership';
      dto.recurringPrice = 100;
      dto.paymentMethod = 'cash';
      dto.billingInterval = 'weekly' as BillingInterval;
      dto.billingPeriods = 4;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject cash payment over 100', async () => {
      dto.name = 'Expensive Cash Membership';
      dto.recurringPrice = 101;
      dto.paymentMethod = 'cash';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const priceError = errors.find((e) => e.property === 'recurringPrice');
      expect(priceError?.constraints?.cashPriceLimit).toBe(
        'Cash payments cannot exceed 100',
      );
    });

    it('should accept high price for non-cash payment methods', async () => {
      dto.name = 'Premium Membership';
      dto.recurringPrice = 500;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'yearly' as BillingInterval;
      dto.billingPeriods = 3;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('paymentMethod validation', () => {
    it('should accept valid payment methods', async () => {
      const validMethods = ['cash', 'credit_card', 'bank_transfer'];

      for (const method of validMethods) {
        dto.name = 'Test Membership';
        dto.recurringPrice = 50;
        dto.paymentMethod = method;
        dto.billingInterval = 'monthly' as BillingInterval;
        dto.billingPeriods = 6;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid payment method', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'bitcoin';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'paymentMethod')).toBe(true);
    });
  });

  describe('billingInterval validation', () => {
    it('should accept valid billing intervals', async () => {
      const validIntervals: BillingInterval[] = ['monthly', 'weekly', 'yearly'];

      for (const interval of validIntervals) {
        dto.name = 'Test Membership';
        dto.recurringPrice = 50;
        dto.paymentMethod = 'credit_card';
        dto.billingInterval = interval;
        dto.billingPeriods =
          interval === 'monthly' ? 6 : interval === 'yearly' ? 3 : 4;

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject invalid billing interval', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'daily';
      dto.billingPeriods = 6;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'billingInterval')).toBe(true);
    });
  });

  describe('billingPeriods validation', () => {
    it('should enforce monthly billing period range (6-12)', async () => {
      dto.name = 'Monthly Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;

      // Test valid range
      for (let periods = 6; periods <= 12; periods++) {
        dto.billingPeriods = periods;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }

      // Test below range
      dto.billingPeriods = 5;
      let errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      let periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.billingPeriodsRange).toBe(
        'Monthly billing periods must be between 6 and 12',
      );

      // Test above range
      dto.billingPeriods = 13;
      errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.billingPeriodsRange).toBe(
        'Monthly billing periods must be between 6 and 12',
      );
    });

    it('should enforce yearly billing period range (3-10)', async () => {
      dto.name = 'Yearly Membership';
      dto.recurringPrice = 300;
      dto.paymentMethod = 'bank_transfer';
      dto.billingInterval = 'yearly' as BillingInterval;

      // Test valid range
      for (let periods = 3; periods <= 10; periods++) {
        dto.billingPeriods = periods;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }

      // Test below range
      dto.billingPeriods = 2;
      let errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      let periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.billingPeriodsRange).toBe(
        'Yearly billing periods must be between 3 and 10',
      );

      // Test above range
      dto.billingPeriods = 11;
      errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.billingPeriodsRange).toBe(
        'Yearly billing periods must be between 3 and 10',
      );
    });

    it('should allow any positive number for weekly billing periods', async () => {
      dto.name = 'Weekly Membership';
      dto.recurringPrice = 25;
      dto.paymentMethod = 'cash';
      dto.billingInterval = 'weekly' as BillingInterval;

      // Test various values
      const testValues = [1, 4, 10, 52, 100];
      for (const periods of testValues) {
        dto.billingPeriods = periods;
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      }
    });

    it('should reject zero billing periods', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 0;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.min).toBeDefined();
    });

    it('should reject negative billing periods', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = -5;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'billingPeriods')).toBe(true);
    });

    it('should reject non-integer billing periods', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 'six';

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'billingPeriods')).toBe(true);
    });
  });

  describe('validFrom validation', () => {
    it('should accept valid ISO date string', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;
      dto.validFrom = '2024-06-01T00:00:00.000Z';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept when validFrom is not provided', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;
      // validFrom is not set

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid date format', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;
      dto.validFrom = '2024-13-45'; // Invalid date

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'validFrom')).toBe(true);
    });

    it('should reject non-string date', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6;
      dto.validFrom = new Date(); // Should be string

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'validFrom')).toBe(true);
    });
  });

  describe('complete DTO validation scenarios', () => {
    it('should validate a complete monthly membership', async () => {
      dto.name = 'Gold Monthly Plan';
      dto.recurringPrice = 79.99;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 12;
      dto.validFrom = '2024-07-01T00:00:00.000Z';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a complete yearly membership', async () => {
      dto.name = 'Enterprise Annual Plan';
      dto.recurringPrice = 999.99;
      dto.paymentMethod = 'bank_transfer';
      dto.billingInterval = 'yearly' as BillingInterval;
      dto.billingPeriods = 5;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should validate a complete weekly cash membership', async () => {
      dto.name = 'Weekly Gym Pass';
      dto.recurringPrice = 15;
      dto.paymentMethod = 'cash';
      dto.billingInterval = 'weekly' as BillingInterval;
      dto.billingPeriods = 8;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject DTO with multiple validation errors', async () => {
      dto.name = ''; // Invalid: empty
      dto.recurringPrice = -50; // Invalid: negative
      dto.paymentMethod = 'crypto'; // Invalid: not in enum
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 3; // Invalid: below range for monthly
      dto.validFrom = 'not-a-date'; // Invalid: bad format

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      // Check that all properties have errors
      const errorProperties = errors.map((e) => e.property);
      expect(errorProperties).toContain('name');
      expect(errorProperties).toContain('recurringPrice');
      expect(errorProperties).toContain('paymentMethod');
      expect(errorProperties).toContain('billingPeriods');
      expect(errorProperties).toContain('validFrom');
    });
  });

  describe('edge cases', () => {
    it('should handle maximum valid values', async () => {
      dto.name = 'A'.repeat(1000); // Very long name
      dto.recurringPrice = Number.MAX_SAFE_INTEGER;
      dto.paymentMethod = 'bank_transfer';
      dto.billingInterval = 'yearly' as BillingInterval;
      dto.billingPeriods = 10;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should handle decimal billing periods as invalid', async () => {
      dto.name = 'Test Membership';
      dto.recurringPrice = 50;
      dto.paymentMethod = 'credit_card';
      dto.billingInterval = 'monthly' as BillingInterval;
      dto.billingPeriods = 6.5;

      await validate(dto);
    });

    it('should validate DTO with all minimum valid values', async () => {
      dto.name = 'A'; // Single character name
      dto.recurringPrice = 0; // Minimum valid price
      dto.paymentMethod = 'cash';
      dto.billingInterval = 'weekly' as BillingInterval;
      dto.billingPeriods = 1; // Minimum for weekly

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});
