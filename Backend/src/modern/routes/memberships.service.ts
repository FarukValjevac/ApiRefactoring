// memberships.service.ts
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import initialMembershipsJson from '../../data/memberships.json';
import initialMembershipPeriodsJson from '../../data/membership-periods.json';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { BillingInterval } from './types/memberships-types';

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

    switch (billingInterval) {
      case 'monthly':
        validUntil.setMonth(validFrom.getMonth() + billingPeriods);
        break;
      case 'yearly':
        validUntil.setMonth(validFrom.getMonth() + billingPeriods * 12);
        break;
      case 'weekly':
        validUntil.setDate(validFrom.getDate() + billingPeriods * 7);
        break;
    }

    return validUntil;
  }

  private determineMembershipState(
    validFrom: Date,
    validUntil: Date,
  ): Membership['state'] {
    const now = new Date();

    if (validFrom > now) {
      return 'pending';
    }
    if (validUntil < now) {
      return 'expired';
    }
    return 'active';
  }

  private buildMembership(
    dto: CreateMembershipDto,
    validFrom: Date,
    validUntil: Date,
    state: Membership['state'],
  ): Membership {
    const nextMembershipId = this.getNextMembershipId();

    return {
      id: nextMembershipId,
      uuid: uuidv4(),
      name: dto.name,
      state: state,
      validFrom: validFrom,
      validUntil: validUntil,
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
    billingInterval: 'monthly' | 'yearly' | 'weekly',
    billingPeriods: number,
  ): MembershipPeriod[] {
    const periods: MembershipPeriod[] = [];
    let periodStart = new Date(validFrom);
    const maxExistingPeriodId = this.getMaxPeriodId();

    for (let i = 0; i < billingPeriods; i++) {
      const periodEnd = this.calculatePeriodEnd(periodStart, billingInterval);

      const period: MembershipPeriod = {
        id: maxExistingPeriodId + periods.length + 1,
        uuid: uuidv4(),
        membership: membership.id,
        start: new Date(periodStart),
        end: periodEnd,
        state: 'issued',
      };

      periods.push(period);
      periodStart = new Date(periodEnd);
    }

    return periods;
  }

  private calculatePeriodEnd(
    periodStart: Date,
    billingInterval: 'monthly' | 'yearly' | 'weekly',
  ): Date {
    const periodEnd = new Date(periodStart);

    switch (billingInterval) {
      case 'monthly':
        periodEnd.setMonth(periodStart.getMonth() + 1);
        break;
      case 'yearly':
        periodEnd.setMonth(periodStart.getMonth() + 12);
        break;
      case 'weekly':
        periodEnd.setDate(periodStart.getDate() + 7);
        break;
    }

    return periodEnd;
  }

  private getNextMembershipId(): number {
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
