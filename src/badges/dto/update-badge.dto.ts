import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBadgeDto } from './create-badge.dto';
import { IsUUID } from 'class-validator';

export class UpdateBadgeDto extends PartialType(CreateBadgeDto) {
  /**
   * ID of the badge to update
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the badge to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;
}
