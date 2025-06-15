import { Controller, Post, Get, Body, ValidationPipe } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/createMembership.dto';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createMembershipDto: CreateMembershipDto,
  ): Promise<{
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  }> {
    return this.membershipsService.createMembership(createMembershipDto);
  }

  @Get()
  async findAll(): Promise<
    { membership: Membership; periods: MembershipPeriod[] }[]
  > {
    return this.membershipsService.getAllMemberships();
  }
}
