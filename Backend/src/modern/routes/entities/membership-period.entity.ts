import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MembershipEntity } from './membership.entity';

@Entity('membership_periods')
export class MembershipPeriodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true })
  uuid: string;

  @Column({ name: 'membership_id' })
  membershipId: number;

  @Column({ name: 'start_date', type: 'timestamp' })
  start: Date;

  @Column({ name: 'end_date', type: 'timestamp' })
  end: Date;

  @Column()
  state: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => MembershipEntity, (membership) => membership.periods)
  @JoinColumn({ name: 'membership_id' })
  membership: MembershipEntity;
}
