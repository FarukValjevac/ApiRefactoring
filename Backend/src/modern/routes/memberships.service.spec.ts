import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { BillingInterval } from './types/memberships-types';

describe('MembershipsService', () => {
  let service: MembershipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsService],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  describe('createMembership', () => {
    it('should create a membership with default validFrom date when not provided', () => {
      const dto: CreateMembershipDto = {
        name: 'Test Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const result = service.createMembership(dto);

      expect(result.membership).toBeDefined();
      expect(result.membership.name).toBe('Test Membership');
      expect(result.membership.validFrom).toBeInstanceOf(Date);
      expect(result.membership.validFrom.getTime()).toBeCloseTo(
        new Date().getTime(),
        -2,
      );
    });

    it('should create a membership with provided validFrom date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const dto: CreateMembershipDto = {
        name: 'Future Membership',
        recurringPrice: 75,
        paymentMethod: 'bank_transfer',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 8,
        validFrom: futureDate.toISOString(),
      };

      const result = service.createMembership(dto);

      expect(result.membership.validFrom.getTime()).toBe(futureDate.getTime());
      expect(result.membership.state).toBe('pending');
    });

    it('should calculate correct validUntil for monthly billing', () => {
      const startDate = new Date('2024-01-15');
      const dto: CreateMembershipDto = {
        name: 'Monthly Test',
        recurringPrice: 30,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      const expectedEndDate = new Date('2024-07-15');
      expect(result.membership.validUntil.getTime()).toBe(
        expectedEndDate.getTime(),
      );
    });

    it('should calculate correct validUntil for yearly billing', () => {
      const startDate = new Date('2024-01-15');
      const dto: CreateMembershipDto = {
        name: 'Yearly Test',
        recurringPrice: 300,
        paymentMethod: 'bank_transfer',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 3,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      const expectedEndDate = new Date('2027-01-15');
      expect(result.membership.validUntil.getTime()).toBe(
        expectedEndDate.getTime(),
      );
    });

    it('should calculate correct validUntil for weekly billing', () => {
      const startDate = new Date('2024-01-15');
      const dto: CreateMembershipDto = {
        name: 'Weekly Test',
        recurringPrice: 10,
        paymentMethod: 'cash',
        billingInterval: 'weekly' as BillingInterval,
        billingPeriods: 4,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      const expectedEndDate = new Date('2024-02-12');
      expect(result.membership.validUntil.getTime()).toBe(
        expectedEndDate.getTime(),
      );
    });

    it('should set correct membership state based on dates', () => {
      // Test future membership (pending)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const futureMembershipDto: CreateMembershipDto = {
        name: 'Future Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
        validFrom: futureDate.toISOString(),
      };

      const futureResult = service.createMembership(futureMembershipDto);
      expect(futureResult.membership.state).toBe('pending');

      // Test past membership (expired)
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 2);

      const pastMembershipDto: CreateMembershipDto = {
        name: 'Past Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
        validFrom: pastDate.toISOString(),
      };

      const pastResult = service.createMembership(pastMembershipDto);
      expect(pastResult.membership.state).toBe('expired');

      // Test current membership (active)
      const currentMembershipDto: CreateMembershipDto = {
        name: 'Current Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 3,
      };

      const currentResult = service.createMembership(currentMembershipDto);
      expect(currentResult.membership.state).toBe('active');
    });

    it('should create correct number of membership periods', () => {
      const dto: CreateMembershipDto = {
        name: 'Period Test',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 8,
      };

      const result = service.createMembership(dto);

      expect(result.membershipPeriods).toHaveLength(8);
      expect(result.membershipPeriods.every((p) => p.state === 'issued')).toBe(
        true,
      );
    });

    it('should create consecutive membership periods with correct dates', () => {
      const startDate = new Date('2024-01-15');
      const dto: CreateMembershipDto = {
        name: 'Consecutive Period Test',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 3,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      expect(result.membershipPeriods[0].start.getTime()).toBe(
        startDate.getTime(),
      );
      expect(result.membershipPeriods[0].end.getTime()).toBe(
        new Date('2024-02-15').getTime(),
      );

      expect(result.membershipPeriods[1].start.getTime()).toBe(
        new Date('2024-02-15').getTime(),
      );
      expect(result.membershipPeriods[1].end.getTime()).toBe(
        new Date('2024-03-15').getTime(),
      );

      expect(result.membershipPeriods[2].start.getTime()).toBe(
        new Date('2024-03-15').getTime(),
      );
      expect(result.membershipPeriods[2].end.getTime()).toBe(
        new Date('2024-04-15').getTime(),
      );
    });

    it('should generate unique IDs and UUIDs', () => {
      const dto1: CreateMembershipDto = {
        name: 'First Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const dto2: CreateMembershipDto = {
        name: 'Second Membership',
        recurringPrice: 60,
        paymentMethod: 'bank_transfer',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const result1 = service.createMembership(dto1);
      const result2 = service.createMembership(dto2);

      expect(result1.membership.id).not.toBe(result2.membership.id);
      expect(result1.membership.uuid).not.toBe(result2.membership.uuid);
      expect(result1.membership.uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should assign default user ID to memberships', () => {
      const dto: CreateMembershipDto = {
        name: 'User ID Test',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const result = service.createMembership(dto);

      expect(result.membership.userId).toBe(2000);
    });
  });

  describe('getAllMemberships', () => {
    it('should return all memberships with their periods', () => {
      // Create a couple of memberships first
      const dto1: CreateMembershipDto = {
        name: 'First Membership',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const dto2: CreateMembershipDto = {
        name: 'Second Membership',
        recurringPrice: 100,
        paymentMethod: 'bank_transfer',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 3,
      };

      service.createMembership(dto1);
      service.createMembership(dto2);

      const allMemberships = service.getAllMemberships();

      // Should have at least the 2 we created
      expect(allMemberships.length).toBeGreaterThanOrEqual(2);

      // Find our created memberships
      const firstMembership = allMemberships.find(
        (m) => m.membership.name === 'First Membership',
      );
      const secondMembership = allMemberships.find(
        (m) => m.membership.name === 'Second Membership',
      );

      expect(firstMembership).toBeDefined();
      expect(firstMembership!.periods).toHaveLength(6);

      expect(secondMembership).toBeDefined();
      expect(secondMembership!.periods).toHaveLength(3);
    });

    it('should return correct periods for each membership', () => {
      const dto: CreateMembershipDto = {
        name: 'Test Membership for Periods',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 4,
      };

      const createdMembership = service.createMembership(dto);
      const allMemberships = service.getAllMemberships();

      const foundMembership = allMemberships.find(
        (m) => m.membership.id === createdMembership.membership.id,
      );

      expect(foundMembership).toBeDefined();
      expect(foundMembership!.periods).toHaveLength(4);
      expect(
        foundMembership!.periods.every(
          (p) => p.membership === createdMembership.membership.id,
        ),
      ).toBe(true);
    });
  });

  describe('edge cases and date calculations', () => {
    it('should handle month boundaries correctly for monthly billing', () => {
      // Test end of month scenario
      const startDate = new Date('2024-01-31');
      const dto: CreateMembershipDto = {
        name: 'Month Boundary Test',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 1,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      // February doesn't have 31 days, so it should adjust
      expect(result.membership.validUntil.getMonth()).toBe(1); // February
      expect(result.membership.validUntil.getFullYear()).toBe(2024);
    });

    it('should handle leap years correctly', () => {
      const startDate = new Date('2024-02-29'); // 2024 is a leap year
      const dto: CreateMembershipDto = {
        name: 'Leap Year Test',
        recurringPrice: 50,
        paymentMethod: 'credit_card',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 1,
        validFrom: startDate.toISOString(),
      };

      const result = service.createMembership(dto);

      expect(result.membership.validUntil.getFullYear()).toBe(2025);
      expect(result.membership.validUntil.getMonth()).toBe(1); // February
      // 2025 is not a leap year, so Feb 29 becomes Mar 1
      expect(result.membership.validUntil.getDate()).toBe(1);
    });
  });
});
