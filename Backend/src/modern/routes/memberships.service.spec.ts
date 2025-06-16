import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MembershipsService } from './memberships.service';
import { MembershipEntity } from './entities/membership.entity';
import { MembershipPeriodEntity } from './entities/membership-period.entity';

describe('MembershipsService', () => {
  let service: MembershipsService;

  const mockMembershipRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockMembershipPeriodRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MembershipsService,
        {
          provide: getRepositoryToken(MembershipEntity),
          useValue: mockMembershipRepository,
        },
        {
          provide: getRepositoryToken(MembershipPeriodEntity),
          useValue: mockMembershipPeriodRepository,
        },
      ],
    }).compile();

    service = module.get<MembershipsService>(MembershipsService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMembership', () => {
    it('should create a membership successfully', async () => {
      // Arrange
      const createDto = {
        name: 'Test Plan',
        recurringPrice: 50,
        paymentMethod: 'credit card',
        billingInterval: 'monthly' as const,
        billingPeriods: 6,
      };

      const savedMembership = {
        id: 1,
        uuid: 'test-uuid',
        ...createDto,
        userId: 2000,
        validFrom: new Date(),
        validUntil: new Date(),
        state: 'active',
      };

      mockMembershipRepository.create.mockReturnValue(savedMembership);
      mockMembershipRepository.save.mockResolvedValue(savedMembership);
      mockMembershipPeriodRepository.save.mockResolvedValue([]);

      // Act
      const result = await service.createMembership(createDto);

      // Assert
      expect(result.membership.name).toBe('Test Plan');
      expect(result.membership.userId).toBe(2000);
      expect(mockMembershipRepository.create).toHaveBeenCalled();
      expect(mockMembershipRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAllMemberships', () => {
    it('should return empty array when no memberships exist', async () => {
      // Arrange
      mockMembershipRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.getAllMemberships();

      // Assert
      expect(result).toEqual([]);
      expect(mockMembershipRepository.find).toHaveBeenCalledWith({
        relations: ['periods'],
        order: { id: 'ASC' },
      });
    });
  });
});
