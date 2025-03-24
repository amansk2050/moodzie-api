import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdatedUserResponseDto } from './dto-response/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AccountActivatedGuard } from './guards/account-activation.guard';
import { UserService } from './user.service';

/**
 * UserController is responsible for handling incoming requests specific to User and returning responses to the client.
 * It creates a route - "/user"
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('user')
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Get API - "/me" - Get data about current logged in user
   * @param user user information of the current logged in user.
   * @returns returns the user object.
   * @throws UnauthorizedException with message in case user is not logged in.
   */
  @Get('me')
  @ApiOperation({
    description: 'Api to fetch details of logged in user.',
    summary: 'Api to fetch details of logged in user.',
  })
  @ApiOkResponse({
    description: 'Get data about current logged in user',
    type: User,
  })
  @ApiUnauthorizedResponse({ description: 'In case user is not logged in' })
  async getUser(@GetUser() user: User): Promise<User> {
    return user;
  }

  /**
   * Patch API - "/update-me" - it updates user details as per the request body.
   * @param user user information of the current logged in user.
   * @param updateUserDto contains request body data.
   * @returns returns the updated user object and response status.
   * @throws UnauthorizedException in case user is not logged in.
   * @throws ForbiddenException if the account is not activated.
   */
  @Patch('update-me')
  @UseGuards(AccountActivatedGuard)
  @ApiOperation({
    description: 'Api to update user details.',
    summary: 'Api to update user details.',
  })
  @ApiOkResponse({
    description: 'Update User Data',
    type: UpdatedUserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'In case user is not logged in' })
  @ApiForbiddenResponse({ description: 'If the account is not activated' })
  async updateUserDetails(
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() user: User,
  ) {
    const updatedUser = await this.userService.updateUserData(
      updateUserDto,
      user,
    );
    return { status: 'success', data: updatedUser };
  }
}
