import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Mood, MoodType } from './mood.entity';
import { ApiProperty } from '@nestjs/swagger';

/**
 * It describes the relationship between users and their moods
 */
@Entity('user_moods_details')
export class UserMoods {
  /**
   * auto-generated unique uuid primary key for the table.
   */
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * Reference to the user who owns the mood
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * User ID foreign key
   */
  @Column()
  userId: string;

  /**
   * Reference to the mood
   */
  @ManyToOne(() => Mood)
  @JoinColumn({ name: 'moodId' })
  mood: Mood;

  /**
   * Mood ID foreign key
   */
  @Column()
  moodId: string;

  /**
   * How the user acquired this mood (default, purchased, or reward)
   */
  @Column({
    type: 'enum',
    enum: MoodType,
    default: MoodType.DEFAULT,
  })
  @ApiProperty({
    enum: MoodType,
    default: MoodType.DEFAULT,
  })
  acquisitionType: MoodType;

  /**
   * Date when the user acquired this mood
   */
  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  acquiredAt: Date;

  /**
   * Whether this mood is active for the user
   */
  @Column({ default: true })
  isActive: boolean;

  /**
   * Whether the mood is currently selected by the user
   */
  @Column({ default: false })
  isSelected: boolean;

  /**
   * timestamp for creation date
   */
  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  /**
   * timestamp for last update
   */
  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
