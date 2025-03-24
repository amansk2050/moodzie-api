import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { MoodType } from '../entities/mood.entity';

export class CreateMoodDto {
  /**
   * Name of the mood
   * @example "Happy"
   */
  @ApiProperty({
    description: 'Name of the mood',
    example: 'Happy',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Emoji representing the mood
   * @example "😀"
   */
  @ApiProperty({
    description: 'Emoji representing the mood',
    example: '😀',
  })
  @IsNotEmpty()
  @IsString()
  emoji: string;

  /**
   * Color for light theme
   * @example "#FFD700"
   */
  @ApiProperty({
    description: 'Color code for light theme',
    example: '#FFD700',
  })
  @IsNotEmpty()
  @IsString()
  colour: string;

  /**
   * Color for dark theme
   * @example "#DAA520"
   */
  @ApiProperty({
    description: 'Color code for dark theme',
    example: '#DAA520',
  })
  @IsNotEmpty()
  @IsString()
  darkColour: string;

  /**
   * Type of mood
   * @example "default"
   */
  @ApiProperty({
    description: 'Type of the mood',
    enum: MoodType,
    default: MoodType.DEFAULT,
  })
  @IsEnum(MoodType)
  @IsOptional()
  type?: MoodType = MoodType.DEFAULT;

  /**
   * Whether the mood is active
   * @example true
   */
  @ApiProperty({
    description: 'Whether the mood is active',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
