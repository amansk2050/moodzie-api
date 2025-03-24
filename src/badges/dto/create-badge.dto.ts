import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';

export class CreateBadgeDto {
  /**
   * Name of the badge
   * @example "Streak Master"
   */
  @ApiProperty({
    description: 'Name of the badge',
    example: 'Streak Master',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Description of what the badge represents
   * @example "Maintained a 7-day mood tracking streak"
   */
  @ApiProperty({
    description: 'Description of what the badge represents',
    example: 'Maintained a 7-day mood tracking streak',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  /**
   * Icon or image representing the badge
   * @example "streak_badge.png"
   */
  @ApiProperty({
    description: 'Icon or image representing the badge',
    example: 'streak_badge.png',
  })
  @IsNotEmpty()
  @IsString()
  icon: string;

  /**
   * Category of the badge
   * @example "streak"
   */
  @ApiProperty({
    description: 'Category of the badge',
    example: 'streak',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  /**
   * Difficulty or level of the badge
   * @example "bronze"
   */
  @ApiProperty({
    description: 'Difficulty or level of the badge',
    example: 'bronze',
  })
  @IsNotEmpty()
  @IsString()
  level: string;

  /**
   * Points awarded for earning this badge
   * @example 50
   */
  @ApiProperty({
    description: 'Points awarded for earning this badge',
    example: 50,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  points?: number = 0;

  /**
   * Whether the badge is active
   * @example true
   */
  @ApiProperty({
    description: 'Whether the badge is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
