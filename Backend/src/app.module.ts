import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipEntity } from './modern/routes/entities/membership.entity';
import { MembershipPeriodEntity } from './modern/routes/entities/membership-period.entity';
import { MembershipsModule } from './modern/routes/memberships.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'memberships_db'),
        entities: [MembershipEntity, MembershipPeriodEntity],
        synchronize: false,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    MembershipsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
