import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum MoodType {
  DEFAULT = 'default',
  REWARD = 'reward',
  PURCHASE = 'purchase',
}

@Entity('moods_details')
export class Mood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  emoji: string;

  @Column()
  colour: string;

  @Column()
  darkColour: string;

  @Column({
    type: 'enum',
    enum: MoodType,
    default: MoodType.DEFAULT,
  })
  type: MoodType;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
