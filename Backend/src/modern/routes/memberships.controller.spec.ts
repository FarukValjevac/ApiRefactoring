/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { BillingInterval } from './types/memberships-types';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let service: MembershipsService;

  const mockMembership: Membership = {
    id: 1,
    uuid: 'test-uuid',
    name: 'Test Membership',
    state: 'active',
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2024-07-01'),
    userId: 2000,
    paymentMethod: 'credit card',
    recurringPrice: 50,
    billingPeriods: 6,
    billingInterval: 'monthly' as BillingInterval,
  };

  const mockMembershipPeriods: MembershipPeriod[] = [
    {
      id: 1,
      uuid: 'period-uuid-1',
      membership: 1,
      start: new Date('2024-01-01'),
      end: new Date('2024-02-01'),
      state: 'issued',
    },
    {
      id: 2,
      uuid: 'period-uuid-2',
      membership: 1,
      start: new Date('2024-02-01'),
      end: new Date('2024-03-01'),
      state: 'issued',
    },
  ];

  const mockMembershipsService = {
    createMembership: jest.fn(),
    getAllMemberships: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MembershipsController],
      providers: [
        {
          provide: MembershipsService,
          useValue: mockMembershipsService,
        },
      ],
    }).compile();

    controller = module.get<MembershipsController>(MembershipsController);
    service = module.get<MembershipsService>(MembershipsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a membership successfully', () => {
      const dto: CreateMembershipDto = {
        name: 'Test Membership',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const expectedResult = {
        membership: mockMembership,
        membershipPeriods: mockMembershipPeriods,
      };

      mockMembershipsService.createMembership.mockReturnValue(expectedResult);

      const result = controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(service.createMembership).toHaveBeenCalledWith(dto);
      expect(service.createMembership).toHaveBeenCalledTimes(1);
    });

    it('should handle membership creation with validFrom date', () => {
      const dto: CreateMembershipDto = {
        name: 'Future Membership',
        recurringPrice: 75,
        paymentMethod: 'bank_transfer',
        billingInterval: 'yearly' as BillingInterval,
        billingPeriods: 3,
        validFrom: '2024-06-01T00:00:00.000Z',
      };

      const expectedResult = {
        membership: { ...mockMembership, name: 'Future Membership' },
        membershipPeriods: mockMembershipPeriods,
      };

      mockMembershipsService.createMembership.mockReturnValue(expectedResult);

      const result = controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(service.createMembership).toHaveBeenCalledWith(dto);
    });

    it('should handle cash payment memberships', () => {
      const dto: CreateMembershipDto = {
        name: 'Cash Membership',
        recurringPrice: 90,
        paymentMethod: 'cash',
        billingInterval: 'weekly' as BillingInterval,
        billingPeriods: 4,
      };

      const expectedResult = {
        membership: {
          ...mockMembership,
          paymentMethod: 'cash',
          recurringPrice: 90,
        },
        membershipPeriods: mockMembershipPeriods,
      };

      mockMembershipsService.createMembership.mockReturnValue(expectedResult);

      const result = controller.create(dto);

      expect(result).toEqual(expectedResult);
      expect(service.createMembership).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return all memberships with their periods', () => {
      const expectedResult = [
        {
          membership: mockMembership,
          periods: mockMembershipPeriods,
        },
        {
          membership: { ...mockMembership, id: 2, name: 'Second Membership' },
          periods: [
            {
              ...mockMembershipPeriods[0],
              id: 3,
              membership: 2,
            },
          ],
        },
      ];

      mockMembershipsService.getAllMemberships.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.getAllMemberships).toHaveBeenCalledWith();
      expect(service.getAllMemberships).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no memberships exist', () => {
      const expectedResult: {
        membership: Membership;
        periods: MembershipPeriod[];
      }[] = [];

      mockMembershipsService.getAllMemberships.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(service.getAllMemberships).toHaveBeenCalledWith();
    });

    it('should handle memberships without periods', () => {
      const expectedResult = [
        {
          membership: mockMembership,
          periods: [],
        },
      ];

      mockMembershipsService.getAllMemberships.mockReturnValue(expectedResult);

      const result = controller.findAll();

      expect(result).toEqual(expectedResult);
      expect(result[0].periods).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should propagate service errors for create', () => {
      const dto: CreateMembershipDto = {
        name: 'Error Test',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as BillingInterval,
        billingPeriods: 6,
      };

      const error = new Error('Service error');
      mockMembershipsService.createMembership.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.create(dto)).toThrow(error);
    });

    it('should propagate service errors for findAll', () => {
      const error = new Error('Database error');
      mockMembershipsService.getAllMemberships.mockImplementation(() => {
        throw error;
      });

      expect(() => controller.findAll()).toThrow(error);
    });
  });
});
