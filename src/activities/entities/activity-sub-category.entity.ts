import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { ActivityCategory } from './activity-category.entity';

/**
 * Activity Sub-Category entity representing sub-categories within each main category
 * For example: Within Health category, subcategories might be Exercise, Medication, etc.
 */
@Entity('activity_sub_categories')
export class ActivitySubCategory {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * Name of the activity sub-category
   */
  @Column()
  @ApiProperty()
  name: string;

  /**
   * Emoji representing the activity sub-category
   */
  @Column()
  @ApiProperty()
  emoji: string;

  /**
   * Description of the activity sub-category
   */
  @Column({ nullable: true })
  @ApiProperty()
  description: string;

  /**
   * Relationship to the parent category
   */
  @ManyToOne(() => ActivityCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: ActivityCategory;

  /**
   * Foreign key to the parent category
   */
  @Column()
  @ApiProperty()
  categoryId: string;

  /**
   * Primary color for the sub-category
   */
  @Column()
  @ApiProperty()
  color: string;

  /**
   * Dark mode color for the sub-category
   */
  @Column()
  @ApiProperty()
  darkColor: string;

  /**
   * Whether the sub-category is active
   */
  @Column({ default: true })
  @ApiProperty()
  isActive: boolean;

  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
