import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AwardBadgeDto {
  /**
   * ID of the user to award the badge to
   * @example "550e8400-e29b-41d4-a716-446655440000"
   */
  @ApiProperty({
    description: 'ID of the user to award the badge to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  /**
   * ID of the badge to award
   * @example "550e8400-e29b-41d4-a716-446655440001"
   */
  @ApiProperty({
    description: 'ID of the badge to award',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsNotEmpty()
  @IsUUID()
  badgeId: string;
}
