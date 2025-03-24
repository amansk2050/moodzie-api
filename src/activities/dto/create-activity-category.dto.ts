import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateActivityCategoryDto {
  /**
   * Name of the activity category (e.g., Health, Emotions, Food, Sleep)
   * @example "Health"
   */
  @ApiProperty({
    description: 'Name of the activity category',
    example: 'Health',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  /**
   * Emoji representing the category
   * @example "❤️"
   */
  @ApiProperty({
    description: 'Emoji representing the category',
    example: '❤️',
  })
  @IsNotEmpty()
  @IsString()
  emoji: string;

  /**
   * Description of the activity category
   * @example "Track your physical health activities"
   */
  @ApiProperty({
    description: 'Description of the activity category',
    example: 'Track your physical health activities',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Primary color for the category (light theme)
   * @example "#FF5733"
   */
  @ApiProperty({
    description: 'Primary color for the category (light theme)',
    example: '#FF5733',
  })
  @IsNotEmpty()
  @IsString()
  color: string;

  /**
   * Dark mode color for the category
   * @example "#CC4427"
   */
  @ApiProperty({
    description: 'Dark mode color for the category',
    example: '#CC4427',
  })
  @IsNotEmpty()
  @IsString()
  darkColor: string;

  /**
   * Whether the category is active
   * @example true
   */
  @ApiProperty({
    description: 'Whether the category is active',
    example: true,
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
