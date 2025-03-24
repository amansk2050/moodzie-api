import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { Badge } from './badge.entity';

/**
 * UserBadge entity representing badges awarded to users
 */
@Entity('user_badges')
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * Reference to the user who earned the badge
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Foreign key to the user
   */
  @Column()
  @ApiProperty()
  userId: string;

  /**
   * Reference to the badge that was earned
   */
  @ManyToOne(() => Badge)
  @JoinColumn({ name: 'badgeId' })
  badge: Badge;

  /**
   * Foreign key to the badge
   */
  @Column()
  @ApiProperty()
  badgeId: string;

  /**
   * Date when the badge was awarded to the user
   */
  @CreateDateColumn()
  @ApiProperty()
  awardedAt: Date;
}
