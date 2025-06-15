import { Controller, Post, Get, Body, ValidationPipe } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/createMembership.dto';

/**
 * DECISION: Use NestJS Controllers for declarative and type-safe route handling.
 * The `@UseFilters` decorator applies our custom exception filter to all endpoints
 * in this controller, ensuring legacy-compatible error responses.
 */
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * Handles POST requests to create a new membership.
   *
   * DECISION: Use the built-in `ValidationPipe` on the `@Body`.
   * This pipe automatically validates the incoming payload against the `CreateMembershipDto`,
   * transforming it into a typed class instance and triggering our custom validators.
   */
  @Post()
  create(@Body(ValidationPipe) createMembershipDto: CreateMembershipDto): {
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  } {
    /**
     * DECISION: The controller's role is limited to handling the HTTP request/response cycle.
     * All business logic is delegated to the `MembershipsService` for better separation of concerns.
     */
    return this.membershipsService.createMembership(createMembershipDto);
  }

  /**
   * Handles GET requests to list all memberships.
   *
   * ASSUMPTION: Pagination is not required, matching the legacy endpoint's behavior.
   * TODO: Implement pagination when the data set is expected to grow.
   */
  @Get()
  findAll(): { membership: Membership; periods: MembershipPeriod[] }[] {
    // The response structure is intentionally kept identical to the legacy API.
    return this.membershipsService.getAllMemberships();
  }
}
