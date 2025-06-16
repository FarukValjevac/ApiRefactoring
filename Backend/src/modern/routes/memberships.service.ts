import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CreateMembershipDto } from './dto/createMembership.dto';
import { BillingInterval } from './types/memberships.types';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { MembershipEntity } from './entities/membership.entity';
import { MembershipPeriodEntity } from './entities/membership-period.entity';

@Injectable()
export class MembershipsService {
  private readonly DEFAULT_USER_ID = 2000;

  constructor(
    @InjectRepository(MembershipEntity)
    private membershipRepository: Repository<MembershipEntity>,
    @InjectRepository(MembershipPeriodEntity)
    private membershipPeriodRepository: Repository<MembershipPeriodEntity>,
  ) {}

  async createMembership(createMembershipDto: CreateMembershipDto): Promise<{
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  }> {
    const validFrom = createMembershipDto.validFrom
      ? new Date(createMembershipDto.validFrom)
      : new Date();

    const validUntil = this.calculateValidUntil(
      validFrom,
      createMembershipDto.billingInterval,
      createMembershipDto.billingPeriods,
    );

    const state = this.determineMembershipState(validFrom, validUntil);

    // Create and save membership
    const membershipEntity = this.membershipRepository.create({
      uuid: uuidv4(),
      name: createMembershipDto.name,
      state,
      validFrom,
      validUntil,
      userId: this.DEFAULT_USER_ID,
      paymentMethod: createMembershipDto.paymentMethod,
      recurringPrice: createMembershipDto.recurringPrice,
      billingPeriods: createMembershipDto.billingPeriods,
      billingInterval: createMembershipDto.billingInterval,
    });

    const savedMembership =
      await this.membershipRepository.save(membershipEntity);

    // Create membership periods
    const periodEntities = this.createMembershipPeriodEntities(
      savedMembership.id,
      validFrom,
      createMembershipDto.billingInterval,
      createMembershipDto.billingPeriods,
    );

    const savedPeriods =
      await this.membershipPeriodRepository.save(periodEntities);

    // Convert to interface format
    const membership = this.toMembershipInterface(savedMembership);
    const membershipPeriods = savedPeriods.map((p) =>
      this.toMembershipPeriodInterface(p),
    );

    return {
      membership,
      membershipPeriods,
    };
  }

  async getAllMemberships(): Promise<
    {
      membership: Membership;
      periods: MembershipPeriod[];
    }[]
  > {
    const memberships = await this.membershipRepository.find({
      relations: ['periods'],
      order: {
        id: 'ASC',
      },
    });

    return memberships.map((membershipEntity) => ({
      membership: this.toMembershipInterface(membershipEntity),
      periods: membershipEntity.periods.map((p) =>
        this.toMembershipPeriodInterface(p),
      ),
    }));
  }

  /**
   * Deletes a membership by ID.
   * DECISION: Perform a hard delete as requested. The database's ON DELETE CASCADE
   * constraint will automatically remove all associated membership_periods.
   *
   * @param id - The ID of the membership to delete
   * @returns Success message
   * @throws NotFoundException if the membership doesn't exist
   */
  async deleteMembership(id: number): Promise<{ message: string }> {
    // First, check if the membership exists
    const membership = await this.membershipRepository.findOne({
      where: { id },
    });

    if (!membership) {
      throw new NotFoundException(`Membership with ID ${id} not found`);
    }

    // Perform the deletion
    await this.membershipRepository.remove(membership);

    return {
      message: `Membership with ID ${id} has been successfully deleted`,
    };
  }

  private calculateValidUntil(
    validFrom: Date,
    billingInterval: BillingInterval,
    billingPeriods: number,
  ): Date {
    const validUntil = new Date(validFrom);
    switch (billingInterval) {
      case 'monthly':
        validUntil.setMonth(validUntil.getMonth() + billingPeriods);
        break;
      case 'yearly':
        validUntil.setMonth(validUntil.getMonth() + billingPeriods * 12);
        break;
      case 'weekly':
        validUntil.setDate(validUntil.getDate() + billingPeriods * 7);
        break;
    }
    return validUntil;
  }

  private determineMembershipState(validFrom: Date, validUntil: Date): string {
    const now = new Date();
    if (validFrom > now) return 'pending';
    if (validUntil < now) return 'expired';
    return 'active';
  }

  private createMembershipPeriodEntities(
    membershipId: number,
    validFrom: Date,
    billingInterval: BillingInterval,
    billingPeriods: number,
  ): Partial<MembershipPeriodEntity>[] {
    const periods: Partial<MembershipPeriodEntity>[] = [];
    let periodStart = new Date(validFrom);

    for (let i = 0; i < billingPeriods; i++) {
      const periodEnd = this.calculatePeriodEnd(periodStart, billingInterval);
      periods.push({
        uuid: uuidv4(),
        membershipId,
        start: new Date(periodStart),
        end: periodEnd,
        state: 'planned',
      });
      periodStart = new Date(periodEnd);
    }
    return periods;
  }

  private calculatePeriodEnd(
    periodStart: Date,
    billingInterval: BillingInterval,
  ): Date {
    const periodEnd = new Date(periodStart);
    switch (billingInterval) {
      case 'monthly':
        periodEnd.setMonth(periodEnd.getMonth() + 1);
        break;
      case 'yearly':
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        break;
      case 'weekly':
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
    }
    return periodEnd;
  }

  private toMembershipInterface(entity: MembershipEntity): Membership {
    return {
      id: entity.id,
      uuid: entity.uuid,
      name: entity.name,
      userId: entity.userId,
      recurringPrice: Number(entity.recurringPrice),
      validFrom: entity.validFrom,
      validUntil: entity.validUntil,
      state: entity.state,
      paymentMethod: entity.paymentMethod,
      billingInterval: entity.billingInterval,
      billingPeriods: entity.billingPeriods,
    };
  }

  private toMembershipPeriodInterface(
    entity: MembershipPeriodEntity,
  ): MembershipPeriod {
    return {
      id: entity.id,
      uuid: entity.uuid,
      membership: entity.membershipId,
      start: entity.start,
      end: entity.end,
      state: entity.state,
    };
  }
}
