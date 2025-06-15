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
        paymentMethod: 'credit card',
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

    it('should set correct membership state based on dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      // Test future membership (pending)
      const futureMembershipDto: CreateMembershipDto = {
        name: 'Platinum Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
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
        name: 'Gold Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
        validFrom: pastDate.toISOString(),
      };

      const pastResult = service.createMembership(pastMembershipDto);
      expect(pastResult.membership.state).toBe('expired');

      // Test current membership (active)
      const currentMembershipDto: CreateMembershipDto = {
        name: 'Silver Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 3,
      };

      const currentResult = service.createMembership(currentMembershipDto);
      expect(currentResult.membership.state).toBe('active');
    });

    it('should create correct number of membership periods', () => {
      const dto: CreateMembershipDto = {
        name: 'Gold Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 8,
      };

      const result = service.createMembership(dto);

      expect(result.membershipPeriods).toHaveLength(8);
    });

    it('should generate unique IDs and UUIDs', () => {
      const dto1: CreateMembershipDto = {
        name: 'First Membership',
        recurringPrice: 50,
        paymentMethod: 'credit card',
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
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const result = service.createMembership(dto);

      expect(result.membership.userId).toBe(2000);
    });
  });

  describe('getAllMemberships', () => {
    it('should return correct periods for each membership', () => {
      const dto: CreateMembershipDto = {
        name: 'Test Membership for Periods',
        recurringPrice: 50,
        paymentMethod: 'credit card',
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
});
