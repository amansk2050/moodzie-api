import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateMoodDto } from './create-mood.dto';
import { IsUUID } from 'class-validator';

export class UpdateMoodDto extends PartialType(CreateMoodDto) {
  /**
   * ID of the mood to update
   * @example "550e8400-e29b-41d4-a716-446655440001"
   */
  @ApiProperty({
    description: 'ID of the mood to update',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  id: string;
}
