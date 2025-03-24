import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Activity Category entity representing categories like health, emotions, food, sleep
 */
@Entity('activity_categories')
export class ActivityCategory {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * Name of the activity category
   */
  @Column()
  @ApiProperty()
  name: string;

  /**
   * Emoji representing the activity category
   */
  @Column()
  @ApiProperty()
  emoji: string;

  /**
   * Description of the activity category
   */
  @Column({ nullable: true })
  @ApiProperty()
  description: string;

  /**
   * Primary color for the category
   */
  @Column()
  @ApiProperty()
  color: string;

  /**
   * Dark mode color for the category
   */
  @Column()
  @ApiProperty()
  darkColor: string;

  /**
   * Whether the category is active
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
