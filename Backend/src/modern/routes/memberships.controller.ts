import { Controller, Post, Get, Body } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  Membership,
  MembershipPeriod,
} from './dto/interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Controller('memberships') // This maps HTTP requests to /memberships
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * Handles POST requests to /memberships to create a new membership.
   * Mirrors the router.post("/") functionality.
   */
  @Post()
  create(
    @Body() createMembershipDto: CreateMembershipDto, // Extracts the request body and types it as CreateMembershipDto
  ): { membership: Membership; membershipPeriods: MembershipPeriod[] } {
    // Calls the service method to handle the business logic
    return this.membershipsService.createMembership(createMembershipDto);
  }

  /**
   * Handles GET requests to /memberships to list all memberships.
   * Mirrors the router.get("/") functionality.
   */
  @Get()
  findAll(): { membership: Membership; periods: MembershipPeriod[] }[] {
    // Calls the service method to retrieve data
    return this.membershipsService.getAllMemberships();
  }
}
