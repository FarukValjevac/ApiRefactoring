import { validate } from 'class-validator';
import { CreateMembershipDto } from './createMembership.dto';

describe('CreateMembershipDto Validation', () => {
  let dto: CreateMembershipDto;

  beforeEach(() => {
    // Create a valid DTO as baseline
    dto = new CreateMembershipDto();
    dto.name = 'Test Plan';
    dto.recurringPrice = 50;
    dto.paymentMethod = 'credit card';
    dto.billingInterval = 'monthly';
    dto.billingPeriods = 6;
    dto.validFrom = '2025-01-01';
  });

  describe('missingMandatoryFields', () => {
    it('should fail when name is missing', async () => {
      const invalidDto = new CreateMembershipDto();
      invalidDto.recurringPrice = 50;
      invalidDto.paymentMethod = 'credit card';
      invalidDto.billingInterval = 'monthly';
      invalidDto.billingPeriods = 6;
      invalidDto.validFrom = '2025-01-01';

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBe('missingMandatoryFields');
    });

    it('should fail when recurringPrice is missing', async () => {
      const invalidDto = new CreateMembershipDto();
      invalidDto.name = 'Test Plan';
      invalidDto.paymentMethod = 'credit card';
      invalidDto.billingInterval = 'monthly';
      invalidDto.billingPeriods = 6;
      invalidDto.validFrom = '2025-01-01';

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBe('missingMandatoryFields');
    });

    it('should fail when paymentMethod is missing', async () => {
      const invalidDto = new CreateMembershipDto();
      invalidDto.name = 'Test Plan';
      invalidDto.recurringPrice = 50;
      invalidDto.billingInterval = 'monthly';
      invalidDto.billingPeriods = 6;
      invalidDto.validFrom = '2025-01-01';

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBe('missingMandatoryFields');
    });

    it('should fail when billingInterval is missing', async () => {
      const invalidDto = new CreateMembershipDto();
      invalidDto.name = 'Test Plan';
      invalidDto.recurringPrice = 50;
      invalidDto.paymentMethod = 'credit card';
      invalidDto.billingPeriods = 6;
      invalidDto.validFrom = '2025-01-01';

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBe('missingMandatoryFields');
    });

    it('should fail when billingPeriods is missing', async () => {
      const invalidDto = new CreateMembershipDto();
      invalidDto.name = 'Test Plan';
      invalidDto.recurringPrice = 50;
      invalidDto.paymentMethod = 'credit card';
      invalidDto.billingInterval = 'monthly';
      invalidDto.validFrom = '2025-01-01';

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isNotEmpty).toBe('missingMandatoryFields');
    });
  });

  describe('nameMustBeAString', () => {
    it('should fail when name is not a string', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 123,
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly',
        billingPeriods: 6,
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isString).toBe('nameMustBeAString');
    });
  });

  describe('recurringPriceMustBeANumber', () => {
    it('should fail when recurringPrice is not a number', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 'Test Plan',
        recurringPrice: 'fifty',
        paymentMethod: 'credit card',
        billingInterval: 'monthly',
        billingPeriods: 6,
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      const priceError = errors.find((e) => e.property === 'recurringPrice');
      expect(priceError?.constraints?.isNumber).toBe(
        'recurringPriceMustBeANumber',
      );
    });
  });

  describe('negativeRecurringPrice', () => {
    it('should fail when recurringPrice is negative', async () => {
      dto.recurringPrice = -10;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBe('negativeRecurringPrice');
    });

    it('should pass when recurringPrice is 0', async () => {
      dto.recurringPrice = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('cashPriceBelow100', () => {
    it('should fail when cash payment exceeds 100', async () => {
      dto.paymentMethod = 'cash';
      dto.recurringPrice = 150;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.cashPriceLimit).toBe('cashPriceBelow100');
    });

    it('should pass when cash payment is exactly 100', async () => {
      dto.paymentMethod = 'cash';
      dto.recurringPrice = 100;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when cash payment is below 100', async () => {
      dto.paymentMethod = 'cash';
      dto.recurringPrice = 99;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when credit card payment exceeds 100', async () => {
      dto.paymentMethod = 'credit card';
      dto.recurringPrice = 150;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalidPaymentMethod', () => {
    it('should fail when paymentMethod is not valid', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 'Test Plan',
        recurringPrice: 50,
        paymentMethod: 'bitcoin',
        billingInterval: 'monthly',
        billingPeriods: 6,
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEnum).toBe('invalidPaymentMethod');
    });

    it('should pass for cash', async () => {
      dto.paymentMethod = 'cash';
      dto.recurringPrice = 50; // Keep under 100
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass for credit card', async () => {
      dto.paymentMethod = 'credit card';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('invalidBillingInterval', () => {
    it('should fail when billingInterval is not valid', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 'Test Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'daily',
        billingPeriods: 6,
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isEnum).toBe('invalidBillingInterval');
    });

    it('should pass for monthly', async () => {
      dto.billingInterval = 'monthly';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass for weekly', async () => {
      dto.billingInterval = 'weekly';
      dto.billingPeriods = 26; // Valid for weekly
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass for yearly', async () => {
      dto.billingInterval = 'yearly';
      dto.billingPeriods = 5; // Valid for yearly
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('billingPeriodsMustBeANumber', () => {
    it('should fail when billingPeriods is not a number', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 'Test Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly',
        billingPeriods: 'six',
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThan(0);
      const periodError = errors.find((e) => e.property === 'billingPeriods');
      expect(periodError?.constraints?.isNumber).toBe(
        'billingPeriodsMustBeANumber',
      );
    });
  });

  describe('billingPeriodsCannotBeLessThan1', () => {
    it('should fail when billingPeriods is 0', async () => {
      dto.billingPeriods = 0;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBe(
        'billingPeriodsCannotBeLessThan1',
      );
    });

    it('should fail when billingPeriods is negative', async () => {
      dto.billingPeriods = -5;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.min).toBe(
        'billingPeriodsCannotBeLessThan1',
      );
    });

    it('should pass when billingPeriods is 1', async () => {
      dto.billingPeriods = 1;
      dto.billingInterval = 'yearly'; // Valid combination
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Monthly billing period validations', () => {
    beforeEach(() => {
      dto.billingInterval = 'monthly';
    });

    it('should fail with billingPeriodsLessThan6Months', async () => {
      dto.billingPeriods = 5;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.validateBillingPeriods).toBe(
        'billingPeriodsLessThan6Months',
      );
    });

    it('should fail with billingPeriodsMoreThan12Months', async () => {
      dto.billingPeriods = 13;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.validateBillingPeriods).toBe(
        'billingPeriodsMoreThan12Months',
      );
    });

    it('should pass with 6 periods', async () => {
      dto.billingPeriods = 6;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with 12 periods', async () => {
      dto.billingPeriods = 12;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Yearly billing period validations', () => {
    beforeEach(() => {
      dto.billingInterval = 'yearly';
    });

    it('should fail with billingPeriodsMoreThan10Years', async () => {
      dto.billingPeriods = 11;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.validateBillingPeriods).toBe(
        'billingPeriodsMoreThan10Years',
      );
    });

    it('should pass with 1 period', async () => {
      dto.billingPeriods = 1;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with 10 periods', async () => {
      dto.billingPeriods = 10;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Weekly billing period validations', () => {
    beforeEach(() => {
      dto.billingInterval = 'weekly';
    });

    it('should fail with weeklyBillingCannotExceed6Months', async () => {
      dto.billingPeriods = 27;
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.validateBillingPeriods).toBe(
        'weeklyBillingCannotExceed6Months',
      );
    });

    it('should pass with 1 period', async () => {
      dto.billingPeriods = 1;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with 26 periods', async () => {
      dto.billingPeriods = 26;
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validFromMustBeAValidDateString', () => {
    it('should fail when validFrom is not a valid date string', async () => {
      dto.validFrom = 'not-a-date';
      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints?.isDateString).toBe(
        'validFromMustBeAValidDateString',
      );
    });

    it('should pass with valid ISO date string', async () => {
      dto.validFrom = '2025-01-01';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass with valid datetime string', async () => {
      dto.validFrom = '2025-01-01T10:30:00Z';
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should pass when validFrom is omitted (optional)', async () => {
      const dtoWithoutValidFrom = new CreateMembershipDto();
      dtoWithoutValidFrom.name = 'Test Plan';
      dtoWithoutValidFrom.recurringPrice = 50;
      dtoWithoutValidFrom.paymentMethod = 'credit card';
      dtoWithoutValidFrom.billingInterval = 'monthly';
      dtoWithoutValidFrom.billingPeriods = 6;
      // validFrom is not set

      const errors = await validate(dtoWithoutValidFrom);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Multiple validation errors', () => {
    it('should return multiple errors when multiple validations fail', async () => {
      const invalidDto = new CreateMembershipDto();
      Object.assign(invalidDto, {
        name: 123, // nameMustBeAString
        recurringPrice: -10, // negativeRecurringPrice
        paymentMethod: 'bitcoin', // invalidPaymentMethod
        billingInterval: 'monthly',
        billingPeriods: 6,
        validFrom: '2025-01-01',
      });

      const errors = await validate(invalidDto);
      expect(errors.length).toBeGreaterThanOrEqual(3);

      const nameError = errors.find((e) => e.property === 'name');
      const priceError = errors.find((e) => e.property === 'recurringPrice');
      const paymentError = errors.find((e) => e.property === 'paymentMethod');

      expect(nameError).toBeDefined();
      expect(priceError).toBeDefined();
      expect(paymentError).toBeDefined();
    });
  });
});
