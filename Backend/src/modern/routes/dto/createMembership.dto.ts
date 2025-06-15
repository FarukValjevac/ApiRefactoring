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

@ValidatorConstraint({ name: 'cashPriceLimit', async: false })
export class CashPriceLimitConstraint implements ValidatorConstraintInterface {
  validate(recurringPrice: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    return !(object.paymentMethod === 'cash' && recurringPrice > 100);
  }
  defaultMessage() {
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

@ValidatorConstraint({ name: 'validateBillingPeriods', async: false })
export class ValidateBillingPeriodsConstraint
  implements ValidatorConstraintInterface
{
  validate(billingPeriods: number, args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    const validIntervals = ['monthly', 'weekly', 'yearly'];

    // First, check if the interval is valid. If not, this validator should pass
    // to prevent a duplicate error message. The @IsEnum validator on the
    // billingInterval property will handle reporting the error.
    if (!validIntervals.includes(object.billingInterval)) {
      return true;
    }

    switch (object.billingInterval) {
      case 'monthly':
        return billingPeriods >= 6 && billingPeriods <= 12;
      case 'yearly':
        return billingPeriods <= 10;
      case 'weekly':
        return billingPeriods <= 26;
      // No default case needed due to the check above
    }
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateMembershipDto;
    const billingPeriods = args.value as number;

    switch (object.billingInterval) {
      case 'monthly':
        if (billingPeriods < 6) {
          return 'billingPeriodsLessThan6Months';
        }
        if (billingPeriods > 12) {
          return 'billingPeriodsMoreThan12Months';
        }
        break;
      case 'yearly':
        if (billingPeriods > 10) {
          return 'billingPeriodsMoreThan10Years';
        }
        break;
      case 'weekly':
        if (billingPeriods > 26) {
          return 'weeklyBillingCannotExceed6Months';
        }
        break;
    }
    return 'invalidBillingPeriods';
  }
}

export function ValidateBillingPeriods(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidateBillingPeriodsConstraint,
    });
  };
}

export class CreateMembershipDto {
  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsString({ message: 'nameMustBeAString' })
  name: string;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsNumber({}, { message: 'recurringPriceMustBeANumber' })
  @Min(0, { message: 'negativeRecurringPrice' })
  @CashPriceLimit()
  recurringPrice: number;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsEnum(['cash', 'credit card'], {
    message: 'invalidPaymentMethod',
  })
  paymentMethod: string;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsEnum(['monthly', 'weekly', 'yearly'], {
    message: 'invalidBillingInterval',
  })
  billingInterval: BillingInterval;

  @IsNotEmpty({ message: 'missingMandatoryFields' })
  @IsNumber({}, { message: 'billingPeriodsMustBeANumber' })
  @Min(1, { message: 'billingPeriodsCannotBeLessThan1' })
  @ValidateBillingPeriods()
  billingPeriods: number;

  @IsOptional()
  @IsDateString({}, { message: 'validFromMustBeAValidDateString' })
  validFrom?: string;
}
