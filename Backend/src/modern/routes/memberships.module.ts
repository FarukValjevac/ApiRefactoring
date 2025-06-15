import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';
import { MembershipEntity } from './entities/membership.entity';
import { MembershipPeriodEntity } from './entities/membership-period.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MembershipEntity, MembershipPeriodEntity]),
  ],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
