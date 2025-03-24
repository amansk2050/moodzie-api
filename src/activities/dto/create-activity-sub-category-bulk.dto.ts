import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateActivitySubCategoryDto } from './create-activity-sub-category.dto';

export class CreateActivitySubCategoryBulkDto {
  /**
   * Array of sub-categories to create
   */
  @ApiProperty({
    description: 'Array of sub-categories to create',
    type: [CreateActivitySubCategoryDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateActivitySubCategoryDto)
  subCategories: CreateActivitySubCategoryDto[];
}
