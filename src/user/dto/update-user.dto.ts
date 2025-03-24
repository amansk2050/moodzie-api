import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * request DTO with validations for updateUserDetails API.
 */
export class UpdateUserDto {
  /**
   * fullName of user
   */
  @IsString()
  @IsOptional()
  @ApiPropertyOptional()
  fullName?: string;
}
