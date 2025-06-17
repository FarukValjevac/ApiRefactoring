import { BillingInterval } from '../types/memberships.types';

export interface Membership {
  id: number;
  uuid: string;
  name: string;
  userId: number;
  recurringPrice: number;
  assignedBy?: string;
  validFrom: Date;
  validUntil: Date;
  state: string;
  paymentMethod: string;
  billingInterval: BillingInterval;
  billingPeriods: number;
}

export interface MembershipPeriod {
  id: number;
  uuid: string;
  membership: number;
  start: Date;
  end: Date;
  state: string;
}
