import {
  IsString,
  IsNumber,
  IsEnum,
  Min,
  IsOptional,
  IsDateString,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsNotEmpty,
} from 'class-validator';
import { BillingInterval } from '../types/memberships.types';

/**
 * DECISION: Use custom validators with legacy error messages
 * This ensures we can return the exact error codes from the legacy system
 */

/**
 * Custom validator for cash payment limit
 */
@ValidatorConstraint({ name: 'cashPriceLimit', async: false })
export class CashPriceLimitConstraint implements ValidatorConstraintInterface {
  validate(recurringPrice: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    if (object.paymentMethod === 'cash' && recurringPrice > 100) {
      return false;
    }
    return true;
  }

  defaultMessage() {
    // Return legacy error code
    return 'cashPriceBelow100';
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
 * Custom validator for billing periods based on interval
 * Returns specific legacy error codes based on the validation failure
 */
@ValidatorConstraint({ name: 'billingPeriodsRange', async: false })
export class BillingPeriodsRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(billingPeriods: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;

    switch (object.billingInterval) {
      case 'monthly':
        return billingPeriods >= 6 && billingPeriods <= 12;
      case 'yearly':
        return billingPeriods >= 3 && billingPeriods <= 10;
      case 'weekly':
        return billingPeriods >= 1;
      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    const billingPeriods = args.value as number;

    /**
     * Return exact legacy error codes based on the specific validation failure
     */
    switch (object.billingInterval) {
      case 'monthly':
        if (billingPeriods > 12) {
          return 'billingPeriodsMoreThan12Months';
        }
        if (billingPeriods < 6) {
          return 'billingPeriodsLessThan6Months';
        }
        break;
      case 'yearly':
        if (billingPeriods > 10) {
          return 'billingPeriodsMoreThan10Years';
        }
        if (billingPeriods > 3) {
          /**
           * NOTE: Legacy code has a bug here - the message says "LessThan3Years"
           * but the condition checks for MORE than 3 years
           * Preserving this for backward compatibility
           */
          return 'billingPeriodsLessThan3Years';
        }
        break;
    }
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

export class CreateMembershipDto {
  /**
   * DECISION: Use @IsNotEmpty() along with @IsString() to ensure the field is required
   * This will help us detect missing mandatory fields
   */
  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsString({ message: 'missingMandatoryFields' })
  name: string;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsNumber({}, { message: 'missingMandatoryFields' })
  @Min(0, { message: 'negativeRecurringPrice' })
  @CashPriceLimit()
  recurringPrice: number;

  /**
   * NOTE: In legacy code, invalid payment method would likely fail silently
   * or be caught elsewhere. Adding validation for completeness.
   */
  @IsEnum(['cash', 'credit card'], {
    message: 'invalidPaymentMethod',
  })
  paymentMethod: string;

  @IsEnum(['monthly', 'weekly', 'yearly'], {
    message: 'invalidBillingPeriods',
  })
  billingInterval: BillingInterval;

  @IsNumber({}, { message: 'invalidBillingPeriods' })
  @Min(1, { message: 'invalidBillingPeriods' })
  @BillingPeriodsRange()
  billingPeriods: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;
}
