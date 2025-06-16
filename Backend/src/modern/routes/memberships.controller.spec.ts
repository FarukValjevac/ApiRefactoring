/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './dto/createMembership.dto';

describe('MembershipsController', () => {
  let controller: MembershipsController;
  let service: MembershipsService;

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

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /memberships', () => {
    it('should create a membership', async () => {
      // Arrange
      const createDto: CreateMembershipDto = {
        name: 'Test Membership',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly',
        billingPeriods: 6,
      };

      const expectedResponse = {
        membership: {
          id: 1,
          uuid: 'test-uuid',
          name: 'Test Membership',
          userId: 2000,
          recurringPrice: 50,
          validFrom: new Date(),
          validUntil: new Date(),
          state: 'active',
          paymentMethod: 'credit card',
          billingInterval: 'monthly',
          billingPeriods: 6,
        },
        membershipPeriods: [],
      };

      mockMembershipsService.createMembership.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await controller.create(createDto);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.createMembership).toHaveBeenCalledWith(createDto);
      expect(service.createMembership).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /memberships', () => {
    it('should return all memberships', async () => {
      // Arrange
      const expectedResponse = [
        {
          membership: {
            id: 1,
            uuid: 'test-uuid',
            name: 'Test Membership',
            userId: 2000,
            recurringPrice: 50,
            validFrom: new Date(),
            validUntil: new Date(),
            state: 'active',
            paymentMethod: 'credit card',
            billingInterval: 'monthly',
            billingPeriods: 6,
          },
          periods: [],
        },
      ];

      mockMembershipsService.getAllMemberships.mockResolvedValue(
        expectedResponse,
      );

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(service.getAllMemberships).toHaveBeenCalled();
      expect(service.getAllMemberships).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no memberships exist', async () => {
      // Arrange
      mockMembershipsService.getAllMemberships.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toEqual([]);
      expect(service.getAllMemberships).toHaveBeenCalled();
    });
  });
});
