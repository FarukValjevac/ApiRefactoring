import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import initialMembershipsJson from '../../data/memberships.json';
import initialMembershipPeriodsJson from '../../data/membership-periods.json';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/createMembership.dto';
import { BillingInterval } from './types/memberships.types';

/**
 * ASSUMPTION: The source JSON files store dates as ISO strings.
 * DECISION: Create type-safe utility functions to parse these strings into Date objects
 * on application startup, preventing runtime errors and `any` casting.
 */
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

function convertMembershipPeriodDates(
  data: RawMembershipPeriod[],
): MembershipPeriod[] {
  return data.map((p) => ({
    ...p,
    start: new Date(p.start),
    end: new Date(p.end),
  }));
}

/**
 * ASSUMPTION: We are maintaining the legacy system's in-memory data storage.
 * DECISION: Data is stored in module-scoped constants to mimic the simple persistence
 * of the original implementation.
 * NOTE: This means all data is reset upon server restart, which is the expected behavior.
 */
const memberships: Membership[] = convertMembershipDates(
  initialMembershipsJson as RawMembership[],
);
const membershipPeriods: MembershipPeriod[] = convertMembershipPeriodDates(
  initialMembershipPeriodsJson as RawMembershipPeriod[],
);

@Injectable()
export class MembershipsService {
  /**
   * ASSUMPTION: User authentication is outside the current scope.
   * DECISION: Hardcode `userId` to 2000 to match legacy behavior.
   * TODO: Replace this with a proper user context from an authentication service.
   */
  private readonly DEFAULT_USER_ID = 2000;

  createMembership(createMembershipDto: CreateMembershipDto): {
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  } {
    const validFrom = createMembershipDto.validFrom
      ? new Date(createMembershipDto.validFrom)
      : new Date();

    const validUntil = this.calculateValidUntil(
      validFrom,
      createMembershipDto.billingInterval,
      createMembershipDto.billingPeriods,
    );

    const state = this.determineMembershipState(validFrom, validUntil);

    const newMembership = this.buildMembership(
      createMembershipDto,
      validFrom,
      validUntil,
      state,
    );

    // Persist to the in-memory array to match legacy behavior.
    memberships.push(newMembership);

    const newMembershipPeriods = this.createMembershipPeriods(
      newMembership,
      validFrom,
      createMembershipDto.billingInterval,
      createMembershipDto.billingPeriods,
    );

    membershipPeriods.push(...newMembershipPeriods);

    return {
      membership: newMembership,
      membershipPeriods: newMembershipPeriods,
    };
  }

  getAllMemberships(): {
    membership: Membership;
    periods: MembershipPeriod[];
  }[] {
    /**
     * DECISION: The response structure, including the property name 'periods',
     * is kept identical to the legacy API for backward compatibility.
     */
    return memberships.map((membership) => ({
      membership,
      periods: membershipPeriods.filter((p) => p.membership === membership.id),
    }));
  }

  private calculateValidUntil(
    validFrom: Date,
    billingInterval: BillingInterval,
    billingPeriods: number,
  ): Date {
    const validUntil = new Date(validFrom);
    // This logic is extracted for clarity and testability.
    switch (billingInterval) {
      case 'monthly':
        validUntil.setMonth(validUntil.getMonth() + billingPeriods);
        break;
      case 'yearly':
        validUntil.setMonth(validUntil.getMonth() + billingPeriods * 12);
        break;
      case 'weekly':
        validUntil.setDate(validUntil.getDate() + billingPeriods * 7);
        break;
    }
    return validUntil;
  }

  private determineMembershipState(
    validFrom: Date,
    validUntil: Date,
  ): Membership['state'] {
    const now = new Date();
    /**
     * BUSINESS RULE: Membership state is determined by the current time.
     * - pending: The membership starts in the future.
     * - expired: The membership ended in the past.
     * - active:  The current date is within the membership's validity period.
     */
    if (validFrom > now) return 'pending';
    if (validUntil < now) return 'expired';
    return 'active';
  }

  private buildMembership(
    dto: CreateMembershipDto,
    validFrom: Date,
    validUntil: Date,
    state: Membership['state'],
  ): Membership {
    return {
      id: this.getNextMembershipId(),
      uuid: uuidv4(),
      name: dto.name,
      state,
      validFrom,
      validUntil,
      userId: this.DEFAULT_USER_ID,
      paymentMethod: dto.paymentMethod,
      recurringPrice: dto.recurringPrice,
      billingPeriods: dto.billingPeriods,
      billingInterval: dto.billingInterval,
    };
  }

  private createMembershipPeriods(
    membership: Membership,
    validFrom: Date,
    billingInterval: BillingInterval,
    billingPeriods: number,
  ): MembershipPeriod[] {
    const periods: MembershipPeriod[] = [];
    let periodStart = new Date(validFrom);
    const maxExistingPeriodId = this.getMaxPeriodId();

    for (let i = 0; i < billingPeriods; i++) {
      const periodEnd = this.calculatePeriodEnd(periodStart, billingInterval);
      const period: MembershipPeriod = {
        /**
         * BUG FIX: The legacy code used `i + 1` for the period ID, which is not safe
         * and can lead to ID collisions.
         * DECISION: Generate new IDs by incrementing from the highest existing ID
         * across all memberships to guarantee uniqueness.
         */
        id: maxExistingPeriodId + i + 1,
        uuid: uuidv4(),
        membership: membership.id,
        start: new Date(periodStart),
        end: periodEnd,
        /**
         * ASSUMPTION: The state for newly created periods should be 'planned'.
         * NOTE: The legacy code set this to 'planned', which is what we will follow.
         * The existing JSON data might show other states like 'issued' for historical periods.
         */
        state: 'planned',
      };
      periods.push(period);
      periodStart = new Date(periodEnd);
    }
    return periods;
  }

  private calculatePeriodEnd(
    periodStart: Date,
    billingInterval: BillingInterval,
  ): Date {
    const periodEnd = new Date(periodStart);
    switch (billingInterval) {
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'yearly':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      case 'weekly':
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
    }
    return periodEnd;
  }

  private getNextMembershipId(): number {
    /**
     * BUG FIX: The legacy code used `memberships.length + 1` for new IDs, which is
     * unsafe and fails if memberships are ever deleted.
     * DECISION: Use `Math.max` on existing IDs to ensure the next ID is always unique.
     */
    return memberships.length > 0
      ? Math.max(...memberships.map((m) => m.id)) + 1
      : 1;
  }

  private getMaxPeriodId(): number {
    return membershipPeriods.length > 0
      ? Math.max(...membershipPeriods.map((p) => p.id))
      : 0;
  }
}
