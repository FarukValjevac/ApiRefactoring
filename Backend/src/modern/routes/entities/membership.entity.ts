import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MembershipPeriodEntity } from './membership-period.entity';
import { BillingInterval, PaymentMethod } from '../types/memberships.types';

@Entity('memberships')
export class MembershipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column()
  name: string;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'recurring_price', type: 'decimal', precision: 10, scale: 2 })
  recurringPrice: number;

  @Column({ name: 'valid_from', type: 'timestamp' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamp' })
  validUntil: Date;

  @Column()
  state: string;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy?: string;

  @Column({
    name: 'payment_method',
    default: '',
    nullable: false, // Make it non-nullable
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'billing_interval' })
  billingInterval: BillingInterval;

  @Column({ name: 'billing_periods' })
  billingPeriods: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => MembershipPeriodEntity, (period) => period.membership)
  periods: MembershipPeriodEntity[];
}
