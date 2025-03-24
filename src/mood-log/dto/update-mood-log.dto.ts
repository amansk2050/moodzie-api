import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMoodLogDto } from './create-mood-log.dto';
import { IsUUID } from 'class-validator';

export class UpdateMoodLogDto extends PartialType(CreateMoodLogDto) {
  /**
   * ID of the mood log to update
   * @example "550e8400-e29b-41d4-a716-446655440005"
   */
  @ApiProperty({
    description: 'ID of the mood log to update',
    example: '550e8400-e29b-41d4-a716-446655440005',
  })
  @IsUUID()
  id: string;
}
