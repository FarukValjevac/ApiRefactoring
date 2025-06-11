export interface Membership {
  id: number;
  uuid: string;
  name: string;
  userId: number;
  recurringPrice: number;
  validFrom: Date;
  validUntil: Date;
  state: string;
  paymentMethod: string;
  billingInterval: string;
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

export interface CreateMembershipDto {
  name: string;
  recurringPrice: number;
  paymentMethod: string;
  billingInterval: string;
  billingPeriods: number;
  validFrom?: string;
}
