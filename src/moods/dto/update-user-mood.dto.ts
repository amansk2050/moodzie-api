import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { CreateUserMoodDto } from './create-user-mood.dto';
import { IsBoolean, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MoodType } from '../entities/mood.entity';

export class UpdateUserMoodDto extends PartialType(
  OmitType(CreateUserMoodDto, ['userId', 'moodId'] as const),
) {
  /**
   * ID of the user mood record to update
   * @example "550e8400-e29b-41d4-a716-446655440002"
   */
  @ApiProperty({
    description: 'ID of the user mood record to update',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  id: string;

  /**
   * Whether this mood is active for the user
   * @example true
   */
  @ApiProperty({
    description: 'Whether this mood is active for the user',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  /**
   * Whether this mood is selected by the user
   * @example true
   */
  @ApiProperty({
    description: 'Whether this mood is selected by the user',
  })
  @IsBoolean()
  @IsOptional()
  isSelected?: boolean;

  /**
   * How the user acquired this mood
   * @example "reward"
   */
  @ApiProperty({
    description: 'How the user acquired this mood',
    enum: MoodType,
  })
  @IsEnum(MoodType)
  @IsOptional()
  acquisitionType?: MoodType;
}
