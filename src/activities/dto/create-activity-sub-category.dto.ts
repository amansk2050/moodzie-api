import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateActivitySubCategoryDto {
  /**
   * Name of the activity sub-category
   * @example "Exercise"
   */
  @ApiProperty({
    description: 'Name of the activity sub-category',
    example: 'Exercise',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Emoji representing the sub-category
   * @example "🏃"
   */
  @ApiProperty({
    description: 'Emoji representing the sub-category',
    example: '🏃',
  })
  @IsNotEmpty()
  @IsString()
  emoji: string;

  /**
   * Description of the activity sub-category
   * @example "Physical activities for health"
   */
  @ApiProperty({
    description: 'Description of the activity sub-category',
    example: 'Physical activities for health',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * ID of the parent category
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the parent category',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  /**
   * Primary color for the sub-category (light theme)
   * @example "#4CAF50"
   */
  @ApiProperty({
    description: 'Primary color for the sub-category (light theme)',
    example: '#4CAF50',
  })
  @IsNotEmpty()
  @IsString()
  color: string;

  /**
   * Dark mode color for the sub-category
   * @example "#2E7D32"
   */
  @ApiProperty({
    description: 'Dark mode color for the sub-category',
    example: '#2E7D32',
  })
  @IsNotEmpty()
  @IsString()
  darkColor: string;

  /**
   * Whether the sub-category is active
   * @example true
   */
  @ApiProperty({
    description: 'Whether the sub-category is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
