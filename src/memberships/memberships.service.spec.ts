import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from '../memberships/interfaces/memberships.interfaces';

describe('MembershipsService', () => {
  let service: MembershipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MembershipsService],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);
  });

  describe('createMembership', () => {
    const baseDto: CreateMembershipDto = {
      name: 'Gold Plan',
      recurringPrice: 50,
      paymentMethod: 'card',
      billingInterval: 'monthly',
      billingPeriods: 6,
      validFrom: new Date().toISOString(),
    };

    it('should create a membership successfully', () => {
      const result = service.createMembership(baseDto);
      expect(result.membership.name).toBe(baseDto.name);
      expect(result.membership.billingPeriods).toBe(baseDto.billingPeriods);
      expect(result.membership.uuid).toBeDefined();
      expect(result.membership.state).toBe('active');
      expect(result.membership.validUntil > result.membership.validFrom).toBe(
        true,
      );
      expect(result.membership.userId).toBe(2000);
      expect(result.membership.billingInterval).toBe(baseDto.billingInterval);
      expect(result.membership.paymentMethod).toBe(baseDto.paymentMethod);
      expect(result.membership.recurringPrice).toBe(baseDto.recurringPrice);
      expect(result.membership.id).toBeGreaterThan(0);
    });

    it('should throw missingMandatoryFields', () => {
      expect(() =>
        service.createMembership({
          ...baseDto,
          name: '',
        }),
      ).toThrow('missingMandatoryFields');
    });

    it('should throw negativeRecurringPrice', () => {
      expect(() =>
        service.createMembership({ ...baseDto, recurringPrice: -10 }),
      ).toThrow('negativeRecurringPrice');
    });

    it('should throw cashPriceBelow100', () => {
      expect(() =>
        service.createMembership({
          ...baseDto,
          recurringPrice: 120,
          paymentMethod: 'cash',
        }),
      ).toThrow('cashPriceBelow100');
    });

    it('should throw invalidBillingPeriods', () => {
      expect(() =>
        service.createMembership({
          ...baseDto,
          billingInterval: 'something',
        }),
      ).toThrow('invalidBillingPeriods');
    });

    it('should throw billingPeriodsMoreThan12Months', () => {
      expect(() =>
        service.createMembership({ ...baseDto, billingPeriods: 13 }),
      ).toThrow('billingPeriodsMoreThan12Months');
    });

    it('should throw billingPeriodsLessThan6Months', () => {
      expect(() =>
        service.createMembership({ ...baseDto, billingPeriods: 4 }),
      ).toThrow('billingPeriodsLessThan6Months');
    });

    it('should throw billingPeriodsLessThan3Years', () => {
      const dto: CreateMembershipDto = {
        ...baseDto,
        billingInterval: 'yearly',
        billingPeriods: 2,
      };
      expect(() => service.createMembership(dto)).toThrow(
        'billingPeriodsLessThan3Years',
      );
    });

    it('should throw billingPeriodsMoreThan10Years', () => {
      const dto: CreateMembershipDto = {
        ...baseDto,
        billingInterval: 'yearly',
        billingPeriods: 11,
      };
      expect(() => service.createMembership(dto)).toThrow(
        'billingPeriodsMoreThan10Years',
      );
    });
  });

  describe('getAllMemberships', () => {
    it('should return all memberships with their periods', () => {
      const dto = {
        name: 'Platinum Plan',
        recurringPrice: 80,
        paymentMethod: 'card',
        billingInterval: 'monthly',
        billingPeriods: 6,
      };
      service.createMembership(dto as CreateMembershipDto);
      const all = service.getAllMemberships();
      expect(all[0].membership.name).toBe('Platinum Plan');
    });
  });
});
