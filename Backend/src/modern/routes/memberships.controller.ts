import {
  Controller,
  Post,
  Get,
  Body,
  ValidationPipe,
  UseFilters,
} from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import {
  Membership,
  MembershipPeriod,
} from './interfaces/memberships.interfaces';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { LegacyValidationExceptionFilter } from './filters/legacy-validation-exception.filter';

/**
 * DECISION: Use NestJS Controller decorator for cleaner route handling
 * This replaces Express router.get/post with decorators
 * Benefits: Better type safety, automatic dependency injection, cleaner code
 *
 * DECISION: Apply LegacyValidationExceptionFilter to maintain exact error format
 * This ensures our responses match the legacy API format: { "message": "errorCode" }
 */
@Controller('memberships')
@UseFilters(new LegacyValidationExceptionFilter())
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /**
   * Handles POST requests to /memberships to create a new membership.
   *
   * DECISION: Apply ValidationPipe directly to the @Body parameter
   * This provides automatic validation before the method executes:
   * - Validates all constraints defined in CreateMembershipDto
   * - Transforms plain JSON to typed DTO instance
   * - Returns 400 Bad Request if validation fails
   *
   * The LegacyValidationExceptionFilter transforms validation errors
   * to match the legacy format: { "message": "errorCode" }
   */
  @Post()
  create(@Body(ValidationPipe) createMembershipDto: CreateMembershipDto): {
    membership: Membership;
    membershipPeriods: MembershipPeriod[];
  } {
    /**
     * DECISION: Controller only handles HTTP concerns, delegates business logic to service
     * This separation allows for easier testing and potential reuse of business logic
     */
    return this.membershipsService.createMembership(createMembershipDto);
  }

  /**
   * Handles GET requests to /memberships to list all memberships.
   *
   * ASSUMPTION: No pagination needed at this time (matching legacy behavior)
   * TODO: Add pagination when dataset grows larger
   *
   * DECISION: Return exact same response structure as legacy API
   * Note the property name 'periods' (not 'membershipPeriods') for backward compatibility
   */
  @Get()
  findAll(): { membership: Membership; periods: MembershipPeriod[] }[] {
    return this.membershipsService.getAllMemberships();
  }
}
