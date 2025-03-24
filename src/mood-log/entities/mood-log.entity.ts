import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../user/entities/user.entity';
import { UserMoods } from '../../moods/entities/user-moods.entity';
import { ActivityCategory } from '../../activities/entities/activity-category.entity';
import { ActivitySubCategory } from '../../activities/entities/activity-sub-category.entity';

/**
 * MoodLog entity representing a user's mood entry with associated details
 * This is the primary feature of the application, allowing users to record their moods
 * along with associated activities and notes.
 */
@Entity('mood_logs')
export class MoodLog {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'Unique identifier for the mood log' })
  id: string;

  /**
   * Reference to the user who created the mood log
   */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Foreign key to the user
   */
  @Column()
  @ApiProperty({ description: 'ID of the user who created this mood log' })
  userId: string;

  /**
   * Reference to the user's mood selected for this log
   */
  @ManyToOne(() => UserMoods)
  @JoinColumn({ name: 'userMoodId' })
  userMood: UserMoods;

  /**
   * Foreign key to the user mood
   */
  @Column()
  @ApiProperty({ description: 'ID of the user mood selected for this log' })
  userMoodId: string;

  /**
   * Optional text description or notes about the mood or feelings
   */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({
    description: 'Optional notes about the mood or feelings',
    required: false,
  })
  notes: string;

  /**
   * Activity categories associated with this mood log
   */
  @ManyToMany(() => ActivityCategory)
  @JoinTable({
    name: 'mood_log_categories',
    joinColumn: { name: 'moodLogId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'Activity categories associated with this mood',
    type: [ActivityCategory],
  })
  categories: ActivityCategory[];

  /**
   * Activity sub-categories associated with this mood log
   */
  @ManyToMany(() => ActivitySubCategory)
  @JoinTable({
    name: 'mood_log_subcategories',
    joinColumn: { name: 'moodLogId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'subCategoryId', referencedColumnName: 'id' },
  })
  @ApiProperty({
    description: 'Activity sub-categories associated with this mood',
    type: [ActivitySubCategory],
  })
  subCategories: ActivitySubCategory[];

  /**
   * Date and time when the mood was experienced
   * (can be different from the creation date)
   */
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty({ description: 'Date and time when the mood was experienced' })
  moodDate: Date;

  /**
   * Whether this log should appear in public feeds (if sharing features are implemented)
   */
  @Column({ default: false })
  @ApiProperty({
    description: 'Whether this log is visible to others',
    default: false,
  })
  isPublic: boolean;

  /**
   * Date when the log was created
   */
  @CreateDateColumn()
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  /**
   * Date when the log was last updated
   */
  @UpdateDateColumn()
  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
