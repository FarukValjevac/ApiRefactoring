import { Injectable, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import initialMembershipsJson from '../../data/memberships.json';
import initialMembershipPeriodsJson from '../../data/membership-periods.json';
import {
  Membership,
  MembershipPeriod,
  CreateMembershipDto,
} from './interfaces/memberships.interfaces';

// Raw types that match the JSON input structure
type RawMembership = Omit<Membership, 'validFrom' | 'validUntil'> & {
  validFrom: string;
  validUntil: string;
};

type RawMembershipPeriod = Omit<MembershipPeriod, 'start' | 'end'> & {
  start: string;
  end: string;
};

// Typed conversion functions
function convertMembershipDates(data: RawMembership[]): Membership[] {
  return data.map((m) => ({
    ...m,
    validFrom: new Date(m.validFrom),
    validUntil: new Date(m.validUntil),
  }));
}

// Typed conversion functions
function convertMembershipPeriodDates(
  data: RawMembershipPeriod[],
): MembershipPeriod[] {
  return data.map((p) => ({
    ...p,
    start: new Date(p.start),
    end: new Date(p.end),
  }));
}

// Initialize memberships and membershipPeriods using the conversion functions
const memberships: Membership[] = convertMembershipDates(
  initialMembershipsJson as RawMembership[],
);
const membershipPeriods: MembershipPeriod[] = convertMembershipPeriodDates(
  initialMembershipPeriodsJson as RawMembershipPeriod[],
);

@Injectable()
export class MembershipsService {
  createMembership(createMembershipDto: CreateMembershipDto): {
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  } {
    const userId = 2000;

    const {
      name,
      recurringPrice,
      paymentMethod,
      billingInterval,
      billingPeriods,
      validFrom: dtoValidFrom,
    } = createMembershipDto;

    // --- Validation ---
    if (!name || recurringPrice === undefined || recurringPrice === null) {
      throw new BadRequestException('missingMandatoryFields');
    }

    if (recurringPrice < 0) {
      throw new BadRequestException('negativeRecurringPrice');
    }

    if (recurringPrice > 100 && paymentMethod === 'cash') {
      throw new BadRequestException('cashPriceBelow100');
    }

    const isBillingInterval = (
      val: string,
    ): val is 'monthly' | 'yearly' | 'weekly' =>
      ['monthly', 'yearly', 'weekly'].includes(val);

    if (!isBillingInterval(billingInterval)) {
      throw new BadRequestException('invalidBillingPeriods');
    }

    const validatedBillingInterval = billingInterval;

    if (validatedBillingInterval === 'monthly') {
      if (billingPeriods > 12) {
        throw new BadRequestException('billingPeriodsMoreThan12Months');
      }
      if (billingPeriods < 6) {
        throw new BadRequestException('billingPeriodsLessThan6Months');
      }
    } else if (validatedBillingInterval === 'yearly') {
      if (billingPeriods < 3) {
        throw new BadRequestException('billingPeriodsLessThan3Years');
      }
      if (billingPeriods > 10) {
        throw new BadRequestException('billingPeriodsMoreThan10Years');
      }
    }
    // --- End Validation ---

    function parseISODate(dateStr: string): Date {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) {
        throw new BadRequestException(`Invalid date string: ${dateStr}`); // IMO this was missing so I added it in this version
      }
      return parsed;
    }

    const validFrom = dtoValidFrom ? parseISODate(dtoValidFrom) : new Date();

    const validUntil = new Date(validFrom);

    if (validatedBillingInterval === 'monthly') {
      validUntil.setMonth(validFrom.getMonth() + billingPeriods);
    } else if (validatedBillingInterval === 'yearly') {
      validUntil.setMonth(validFrom.getMonth() + billingPeriods * 12);
    } else if (validatedBillingInterval === 'weekly') {
      validUntil.setDate(validFrom.getDate() + billingPeriods * 7);
    }

    let state: Membership['state'] = 'active';
    const now = new Date();

    if (validFrom > now) {
      state = 'pending';
    }
    if (validUntil < now) {
      state = 'expired';
    }

    const nextMembershipId =
      memberships.length > 0
        ? Math.max(...memberships.map((m) => m.id)) + 1
        : 1;

    const newMembership: Membership = {
      id: nextMembershipId,
      uuid: uuidv4(),
      name: name,
      state: state,
      validFrom: validFrom,
      validUntil: validUntil,
      userId: userId,
      paymentMethod: paymentMethod,
      recurringPrice: recurringPrice,
      billingPeriods: billingPeriods,
      billingInterval: validatedBillingInterval,
    };
    memberships.push(newMembership);

    const newMembershipPeriods: MembershipPeriod[] = [];
    let periodStart = new Date(validFrom);

    let maxExistingPeriodId = 0;
    if (membershipPeriods.length > 0) {
      maxExistingPeriodId = Math.max(...membershipPeriods.map((p) => p.id));
    }

    for (let i = 0; i < billingPeriods; i++) {
      const currentPeriodValidFrom = new Date(periodStart);
      const currentPeriodValidUntil = new Date(currentPeriodValidFrom);

      if (validatedBillingInterval === 'monthly') {
        currentPeriodValidUntil.setMonth(currentPeriodValidFrom.getMonth() + 1);
      } else if (validatedBillingInterval === 'yearly') {
        currentPeriodValidUntil.setMonth(
          currentPeriodValidFrom.getMonth() + 12,
        );
      } else if (validatedBillingInterval === 'weekly') {
        currentPeriodValidUntil.setDate(currentPeriodValidFrom.getDate() + 7);
      }

      const period: MembershipPeriod = {
        id: maxExistingPeriodId + newMembershipPeriods.length + 1,
        uuid: uuidv4(),
        membership: newMembership.id,
        start: currentPeriodValidFrom,
        end: currentPeriodValidUntil,
        state: 'issued',
      };
      newMembershipPeriods.push(period);
      membershipPeriods.push(period);
      periodStart = new Date(currentPeriodValidUntil);
    }

    return {
      membership: newMembership,
      membershipPeriods: newMembershipPeriods,
    };
  }

  getAllMemberships(): {
    membership: Membership;
    periods: MembershipPeriod[];
  }[] {
    const rows: { membership: Membership; periods: MembershipPeriod[] }[] = [];
    for (const membership of memberships) {
      const periods = membershipPeriods.filter(
        (p) => p.membership === membership.id,
      );
      rows.push({ membership, periods });
    }
    return rows;
  }
}
