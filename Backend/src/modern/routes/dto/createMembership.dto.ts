import {
  IsString,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { BillingInterval } from '../types/memberships.types';

/**
 * DECISION: Use custom class-validator decorators.
 * This approach allows us to embed the exact legacy error messages directly
 * into the validation logic, ensuring 1:1 error parity with the old system.
 */

/**
 * Custom validator to enforce the legacy rule that cash payments cannot exceed 100.
 */
@ValidatorConstraint({ name: 'cashPriceLimit', async: false })
export class CashPriceLimitConstraint implements ValidatorConstraintInterface {
  validate(recurringPrice: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    return !(object.paymentMethod === 'cash' && recurringPrice > 100);
  }

  defaultMessage() {
    return 'cashPriceBelow100'; // Return legacy error message.
  }
}

export function CashPriceLimit(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CashPriceLimitConstraint,
    });
  };
}

/**
 * Custom validator for billing periods, designed to exactly replicate legacy behavior, including bugs.
 *
 * IMPORTANT: This validator intentionally preserves the following legacy bugs for compatibility:
 * 1. Monthly: The check for `billingPeriods < 6` never triggers due to a typo in the legacy
 * code (`req.billingPeriods` instead of `req.body.billingPeriods`).
 * 2. Yearly: The logic for periods between 4 and 10 is flawed, incorrectly returning
 * the "billingPeriodsLessThan3Years" error.
 * 3. Weekly: This interval is not handled in the legacy if/else-if block, causing it to
 * fall through to the final 'else' and trigger an 'invalidBillingPeriods' error.
 */
@ValidatorConstraint({ name: 'billingPeriodsRange', async: false })
export class BillingPeriodsRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(billingPeriods: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;

    // This validator only cares about the upper/lower bounds of valid intervals.
    // The `BillingIntervalElseClause` validator handles intervals that shouldn't be processed.
    if (
      !object.billingInterval ||
      ['monthly', 'yearly'].indexOf(object.billingInterval) === -1
    ) {
      return true;
    }

    switch (object.billingInterval) {
      case 'monthly':
        // LEGACY BUG REPLICATION: The legacy code typo means the `< 6` check never ran.
        // We only validate the upper bound to match.
        return billingPeriods <= 12;
      case 'yearly':
        // Legacy code only permits 1, 2, or 3 years. Anything higher is rejected.
        return billingPeriods <= 3;
      default:
        // Other intervals are handled by `BillingIntervalElseClause`.
        return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    const billingPeriods = args.value as number;

    if (!object.billingInterval) {
      return 'invalidBillingPeriods';
    }

    switch (object.billingInterval) {
      case 'monthly':
        if (billingPeriods > 12) {
          return 'billingPeriodsMoreThan12Months';
        }
        // This message is preserved for completeness but will never be triggered, matching the legacy bug.
        if (billingPeriods < 6) {
          return 'billingPeriodsLessThan6Months';
        }
        break;
      case 'yearly':
        if (billingPeriods > 10) {
          return 'billingPeriodsMoreThan10Years';
        }
        /**
         * LEGACY BUG REPLICATION: This logic exactly matches the flawed legacy implementation.
         * The original code was: if (billingPeriods > 3) { if (billingPeriods > 10) {...} else {...} }
         * This caused any value from 4-10 to incorrectly return "billingPeriodsLessThan3Years".
         */
        if (billingPeriods > 3) {
          return 'billingPeriodsLessThan3Years';
        }
        break;
    }
    // Fallback message.
    return 'invalidBillingPeriods';
  }
}

export function BillingPeriodsRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BillingPeriodsRangeConstraint,
    });
  };
}

/**
 * Custom validator to replicate the legacy `else` clause behavior.
 * This is crucial for rejecting intervals like 'weekly' which were not
 * explicitly handled in the legacy `if/else if` chain.
 */
@ValidatorConstraint({ name: 'billingIntervalElseClause', async: false })
export class BillingIntervalElseClauseConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;

    // In the legacy system, only 'monthly' and 'yearly' were valid.
    // Anything else, including 'weekly' or undefined, fell into the final else block.
    return (
      object.billingInterval === 'monthly' ||
      object.billingInterval === 'yearly'
    );
  }

  defaultMessage() {
    return 'invalidBillingPeriods';
  }
}

export function BillingIntervalElseClause(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BillingIntervalElseClauseConstraint,
    });
  };
}

export class CreateMembershipDto {
  /**
   * DECISION: Use `@IsNotEmpty` to ensure the field is present, mapping to the
   * `missingMandatoryFields` error message for consistency.
   */
  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsString({ message: 'missingMandatoryFields' }) // Redundant but harmless.
  name: string;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsNumber({}, { message: 'missingMandatoryFields' })
  @Min(0, { message: 'negativeRecurringPrice' })
  @CashPriceLimit()
  recurringPrice: number;

  @IsEnum(['cash', 'credit card'], {
    message: 'invalidPaymentMethod',
  })
  paymentMethod: string;

  /**
   * This field is validated by `BillingIntervalElseClause` to replicate legacy logic
   * where only 'monthly' and 'yearly' were considered valid.
   */
  @IsEnum(['monthly', 'weekly', 'yearly'], {
    message: 'invalidBillingPeriods',
  })
  @BillingIntervalElseClause()
  billingInterval: BillingInterval;

  /**
   * This field's validation is complex due to the need to replicate several legacy bugs.
   * The `BillingPeriodsRange` and `BillingIntervalElseClause` validators work together
   * to ensure perfect compatibility with the original system's flawed logic.
   */
  @IsNumber({}, { message: 'invalidBillingPeriods' })
  @Min(1, { message: 'invalidBillingPeriods' })
  @BillingPeriodsRange()
  billingPeriods: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;
}
