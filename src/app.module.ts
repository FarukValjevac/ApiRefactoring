import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MembershipsModule } from './modern/memberships/memberships.module';

@Module({
  imports: [MembershipsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
