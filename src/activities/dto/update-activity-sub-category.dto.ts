import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateActivitySubCategoryDto } from './create-activity-sub-category.dto';
import { IsUUID } from 'class-validator';

export class UpdateActivitySubCategoryDto extends PartialType(
  CreateActivitySubCategoryDto,
) {
  /**
   * ID of the activity sub-category to update
   * @example "550e8400-e29b-41d4-a716-446655440001"
   */
  @ApiProperty({
    description: 'ID of the activity sub-category to update',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  id: string;
}
