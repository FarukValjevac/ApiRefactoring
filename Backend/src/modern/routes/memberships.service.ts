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
import dayjs from 'dayjs';

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
      assignedBy: createMembershipDto.assignedBy || 'subscriber',
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

  async terminateMembership(id: number): Promise<boolean> {
    const membership = await this.membershipRepository.findOne({
      where: { id },
      relations: ['periods'],
    });

    if (!membership) return false;

    // Check if membership is active or pending
    const isValidState =
      membership.state === 'active' || membership.state === 'pending';

    if (!isValidState) return false;

    // Get current date
    const now = dayjs();

    // Find all future periods (periods that haven't ended yet)
    const remainingPeriods = membership.periods.filter((period) =>
      dayjs(period.end).isAfter(now),
    );

    // Check if we're in the last period
    // If there's only one remaining period and it's currently active, we can't terminate
    if (remainingPeriods.length === 1) {
      const lastPeriod = remainingPeriods[0];
      const isInLastPeriod =
        dayjs(lastPeriod.start).isBefore(now) ||
        dayjs(lastPeriod.start).isSame(now);

      if (isInLastPeriod) {
        return false; // Cannot terminate if in the last period
      }
    }

    // If there are no remaining periods (all expired), we can't terminate
    if (remainingPeriods.length === 0) {
      return false;
    }

    // Terminate all remaining periods
    for (const period of remainingPeriods) {
      period.state = 'terminated';
      await this.membershipPeriodRepository.save(period);
    }

    // Set membership state to terminated
    membership.state = 'terminated';
    await this.membershipRepository.save(membership);

    return true;
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

  /**
   * Determines the state of a membership period based on its dates.
   * BUSINESS RULE: Period states follow the same logic as membership states:
   * - 'pending': Period hasn't started yet
   * - 'active': Current date is within the period
   * - 'expired': Period has ended
   *
   * @param start - The start date of the period
   * @param end - The end date of the period
   * @returns The calculated state
   */
  private determinePeriodState(start: Date, end: Date): string {
    const now = new Date();
    if (start > now) return 'pending';
    if (end < now) return 'expired';
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

      // Calculate the state for this specific period
      const periodState = this.determinePeriodState(periodStart, periodEnd);

      periods.push({
        uuid: uuidv4(),
        membershipId,
        start: new Date(periodStart),
        end: periodEnd,
        state: periodState,
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
      assignedBy: entity.assignedBy,
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
