import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsISO8601,
} from 'class-validator';

export class CreateMoodLogDto {
  /**
   * ID of the user mood to be logged
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the user mood to be logged',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userMoodId: string;

  /**
   * Optional notes about the mood or feelings
   * @example "I'm feeling great today after my morning workout."
   */
  @ApiProperty({
    description: 'Optional notes about the mood or feelings',
    example: "I'm feeling great today after my morning workout.",
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  /**
   * Array of activity category IDs associated with this mood
   * @example ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
   */
  @ApiProperty({
    description: 'Array of activity category IDs associated with this mood',
    type: [String],
    required: false,
    example: [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];

  /**
   * Array of activity sub-category IDs associated with this mood
   * @example ["550e8400-e29b-41d4-a716-446655440003", "550e8400-e29b-41d4-a716-446655440004"]
   */
  @ApiProperty({
    description: 'Array of activity sub-category IDs associated with this mood',
    type: [String],
    required: false,
    example: [
      '550e8400-e29b-41d4-a716-446655440003',
      '550e8400-e29b-41d4-a716-446655440004',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  subCategoryIds?: string[];

  /**
   * Date when the mood was experienced (defaults to current time if not provided)
   * @example "2023-05-20T15:30:00Z"
   */
  @ApiProperty({
    description: 'Date when the mood was experienced',
    example: '2023-05-20T15:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  moodDate?: string;

  /**
   * Whether the log is visible to others (if sharing features are implemented)
   * @example false
   */
  @ApiProperty({
    description: 'Whether the log is visible to others',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = false;
}
