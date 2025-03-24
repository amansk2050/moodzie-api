import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { MoodType } from '../entities/mood.entity';

export class CreateUserMoodDto {
  /**
   * ID of the user who will own this mood
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  /**
   * ID of the mood to be assigned to the user
   * @example "550e8400-e29b-41d4-a716-446655440001"
   */
  @ApiProperty({
    description: 'ID of the mood',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  moodId: string;

  /**
   * How the user acquired this mood
   * @example "default"
   */
  @ApiProperty({
    description: 'How the user acquired this mood',
    enum: MoodType,
    default: MoodType.DEFAULT,
  })
  @IsEnum(MoodType)
  @IsOptional()
  acquisitionType?: MoodType = MoodType.DEFAULT;

  /**
   * Whether this mood is active for the user
   * @example true
   */
  @ApiProperty({
    description: 'Whether this mood is active for the user',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  /**
   * Whether this mood is selected by the user
   * @example false
   */
  @ApiProperty({
    description: 'Whether this mood is selected by the user',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSelected?: boolean = false;
}
