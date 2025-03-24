import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsDate,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMoodLogStreaksDto {
  /**
   * ID of the user whose streak is being tracked
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the user whose streak is being tracked',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * Current streak count (consecutive days)
   * @example 7
   */
  @ApiProperty({
    description: 'Current streak count (consecutive days)',
    example: 7,
    default: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  currentStreak?: number = 1;

  /**
   * Longest streak ever achieved by the user
   * @example 30
   */
  @ApiProperty({
    description: 'Longest streak ever achieved by the user',
    example: 30,
    default: 1,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  longestStreak?: number = 1;

  /**
   * Date of the last mood log that counted toward the streak
   * @example "2023-05-01"
   */
  @ApiProperty({
    description: 'Date of the last mood log that counted toward the streak',
    example: '2023-05-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  lastLogDate?: Date = new Date();

  /**
   * Whether the streak is currently active (not broken)
   * @example true
   */
  @ApiProperty({
    description: 'Whether the streak is currently active (not broken)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  /**
   * Start date of the current streak
   * @example "2023-04-25"
   */
  @ApiProperty({
    description: 'Start date of the current streak',
    example: '2023-04-25',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  currentStreakStartDate?: Date = new Date();

  /**
   * Start date of the longest streak
   * @example "2023-01-01"
   */
  @ApiProperty({
    description: 'Start date of the longest streak',
    example: '2023-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  longestStreakStartDate?: Date;

  /**
   * End date of the longest streak
   * @example "2023-01-30"
   */
  @ApiProperty({
    description: 'End date of the longest streak',
    example: '2023-01-30',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  longestStreakEndDate?: Date;
}
