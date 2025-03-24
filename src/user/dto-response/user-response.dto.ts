import { ApiProperty } from '@nestjs/swagger';
import { User } from '../entities/user.entity';

/**
 * response DTO for updateUserDetails API.
 */
export class UpdatedUserResponseDto {
  /**
   * response message from the API
   */
  @ApiProperty({ description: 'Status of the response' })
  status: string;

  /**
   * user object with updated information
   */
  @ApiProperty({ description: 'Updated User' })
  data: User;
}
