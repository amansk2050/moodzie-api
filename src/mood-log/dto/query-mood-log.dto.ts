import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsDateString,
  IsUUID,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Type } from 'class-transformer';

export enum MoodLogSortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class QueryMoodLogDto {
  /**
   * Start date for filtering logs
   * @example "2023-05-01"
   */
  @ApiProperty({
    description: 'Start date for filtering logs (inclusive)',
    example: '2023-05-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  /**
   * End date for filtering logs
   * @example "2023-05-31"
   */
  @ApiProperty({
    description: 'End date for filtering logs (inclusive)',
    example: '2023-05-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  /**
   * Filter by specific user mood ID
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'Filter by specific user mood ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userMoodId?: string;

  /**
   * Filter by specific activity category ID
   * @example "550e8400-e29b-41d4-a716-446655440001"
   */
  @ApiProperty({
    description: 'Filter by activity category ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  /**
   * Filter by specific activity sub-category ID
   * @example "550e8400-e29b-41d4-a716-446655440003"
   */
  @ApiProperty({
    description: 'Filter by activity sub-category ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  /**
   * Sort order for logs
   * @example "newest"
   */
  @ApiProperty({
    description: 'Sort order for logs',
    enum: MoodLogSortOrder,
    default: MoodLogSortOrder.NEWEST,
    required: false,
  })
  @IsOptional()
  @IsEnum(MoodLogSortOrder)
  sortOrder?: MoodLogSortOrder = MoodLogSortOrder.NEWEST;

  /**
   * Whether to include only public logs
   * @example false
   */
  @ApiProperty({
    description: 'Whether to include only public logs',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Page number for pagination
   * @example 1
   */
  @ApiProperty({
    description: 'Page number for pagination',
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  /**
   * Number of items per page for pagination
   * @example 10
   */
  @ApiProperty({
    description: 'Number of items per page',
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}
