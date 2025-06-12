export interface MembershipItem {
  membership: {
    id: string;
    name: string;
    recurringPrice: number;
    validFrom: string;
    validUntil: string;
    billingInterval: string;
    billingPeriods: number;
  };
}