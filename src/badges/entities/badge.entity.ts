import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Badge entity representing achievements that can be awarded to users
 */
@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * Name of the badge
   */
  @Column()
  @ApiProperty()
  name: string;

  /**
   * Description of what the badge represents
   */
  @Column()
  @ApiProperty()
  description: string;

  /**
   * Icon or image representing the badge (stored as a string path or URL)
   */
  @Column()
  @ApiProperty()
  icon: string;

  /**
   * Category of the badge (e.g., achievement, streak, milestone)
   */
  @Column()
  @ApiProperty()
  category: string;

  /**
   * Difficulty or level of the badge (e.g., bronze, silver, gold)
   */
  @Column()
  @ApiProperty()
  level: string;

  /**
   * Points awarded for earning this badge
   */
  @Column({ default: 0 })
  @ApiProperty()
  points: number;

  /**
   * Whether the badge is currently active in the system
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
