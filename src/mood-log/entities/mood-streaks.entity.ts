import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';

/**
 * MoodStreaks entity for tracking consecutive days of mood logging
 *
 * This entity keeps track of user streak data including:
 * - Current streak (consecutive days)
 * - Longest streak achieved
 * - Last log date (to calculate if streak is maintained)
 * - Whether streak is currently active
 */
@Entity('mood_streaks')
@Index(['userId'], { unique: true })
export class MoodStreaks {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the streak record' })
  id: string;

  /**
   * Reference to the user whose streak is being tracked
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Foreign key to the user
   */
  @Column()
  @ApiProperty({ description: 'ID of the user whose streak is being tracked' })
  userId: string;

  /**
   * Current streak count (consecutive days)
   */
  @Column({ default: 0 })
  @ApiProperty({
    description: 'Current streak count (consecutive days)',
    example: 7,
  })
  currentStreak: number;

  /**
   * Longest streak ever achieved by the user
   */
  @Column({ default: 0 })
  @ApiProperty({
    description: 'Longest streak ever achieved by the user',
    example: 30,
  })
  longestStreak: number;

  /**
   * Date of the last mood log that counted toward the streak
   */
  @Column({ type: 'date', nullable: true })
  @ApiProperty({
    description: 'Date of the last mood log that counted toward the streak',
    example: '2023-05-01',
  })
  lastLogDate: Date;

  /**
   * Whether the streak is currently active (not broken)
   */
  @Column({ default: true })
  @ApiProperty({
    description: 'Whether the streak is currently active (not broken)',
    example: true,
  })
  isActive: boolean;

  /**
   * Start date of the current streak
   */
  @Column({ type: 'date', nullable: true })
  @ApiProperty({
    description: 'Start date of the current streak',
    example: '2023-04-25',
  })
  currentStreakStartDate: Date;

  /**
   * Start date of the longest streak
   */
  @Column({ type: 'date', nullable: true })
  @ApiProperty({
    description: 'Start date of the longest streak',
    example: '2023-01-01',
  })
  longestStreakStartDate: Date;

  /**
   * End date of the longest streak
   */
  @Column({ type: 'date', nullable: true })
  @ApiProperty({
    description: 'End date of the longest streak',
    example: '2023-01-30',
  })
  longestStreakEndDate: Date;

  /**
   * Creation timestamp
   */
  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  /**
   * Last update timestamp
   */
  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
