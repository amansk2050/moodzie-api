import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateMoodLogStreaksDto } from './create-mood-log-streaks.dto';

export class UpdateMoodLogStreaksDto extends PartialType(
  OmitType(CreateMoodLogStreaksDto, ['userId'] as const),
) {
  /**
   * ID of the mood streak record to update
   * @example "550e8400-e29b-41d4-a716-446655440005"
   */
  @ApiProperty({
    description: 'ID of the mood streak record to update',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  @IsUUID()
  id: string;
}
