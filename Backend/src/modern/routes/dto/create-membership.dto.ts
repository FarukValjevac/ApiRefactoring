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
} from 'class-validator';
import { BillingInterval } from '../types/memberships-types';

// Custom validator for cash payment limit
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
    return 'Cash payments cannot exceed 100';
  }
}

// Custom decorator for cash price limit
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

// Custom validator for billing periods based on interval
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
        return billingPeriods >= 1; // No specific limit for weekly
      default:
        return true;
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;

    switch (object.billingInterval) {
      case 'monthly':
        return 'Monthly billing periods must be between 6 and 12';
      case 'yearly':
        return 'Yearly billing periods must be between 3 and 10';
      default:
        return 'Invalid billing periods for the selected interval';
    }
  }
}

// Custom decorator for billing periods range
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
  @IsString()
  name: string;

  @IsNumber()
  @Min(0, { message: 'Recurring price cannot be negative' })
  @CashPriceLimit()
  recurringPrice: number;

  @IsEnum(['cash', 'credit_card', 'bank_transfer'])
  paymentMethod: string;

  @IsEnum(['monthly', 'weekly', 'yearly'])
  billingInterval: BillingInterval;

  @IsNumber()
  @Min(1)
  @BillingPeriodsRange()
  billingPeriods: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;
}
