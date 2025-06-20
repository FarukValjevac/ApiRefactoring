import {
  Controller,
  Post,
  Get,
  Body,
  ValidationPipe,
  Param,
  Delete,
  ParseIntPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
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

  @Post(':id/terminate')
  async terminateMembership(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const result = await this.membershipsService.terminateMembership(id);
    if (!result) {
      throw new HttpException(
        'Termination not allowed: Membership must be active/pending and not in the last period',
        HttpStatus.BAD_REQUEST,
      );
    }
    return { message: 'Membership terminated successfully' };
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.membershipsService.deleteMembership(id);
  }
}
