/**
 * @file Defines the TypeScript interface for membership data.
 * DECISION: This interface models the structure of the data as it is received
 * from the backend API's GET /memberships endpoint. The nested `membership`
 * object matches the response format exactly for type-safe data handling.
 */
export interface MembershipItem {
  membership: {
    id: string; // The UUID of the membership.
    name: string;
    recurringPrice: number;
    validFrom: string; 
    validUntil: string; 
    billingInterval: string;
    billingPeriods: number;
  };
}