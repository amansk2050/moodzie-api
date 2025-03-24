import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateActivityCategoryDto } from './create-activity-category.dto';
import { IsUUID } from 'class-validator';

export class UpdateActivityCategoryDto extends PartialType(
  CreateActivityCategoryDto,
) {
  /**
   * ID of the activity category to update
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the activity category to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;
}
