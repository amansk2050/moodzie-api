import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  Req,
  InternalServerErrorException,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '../user/entities/user.entity';
import { TransformInterceptor } from '../core/transform.interceptor';
import { LoginUserDto } from './dto/login-user.dto';
import { Request } from 'express';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refreshToken.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GetUser } from './decorators/get-user.decorator';
import { UpdateMyPasswordDto } from './dto/update-password.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotAcceptableResponse,
  ApiNotFoundResponse,
  ApiOAuth2,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from './dto-response/user-response.dto';
import { MessageResponseDto } from './dto-response/message-response.dto';
import { LogoutResponseDto } from './dto-response/logout-response.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';

/**
 * AuthController is responsible for handling incoming requests specific to Authentication related APIs and returning responses to the client.
 * it creates a route - "/auth"
 */
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST API - "/signup" - used for signing up the user and send mail with activation token to the given email for account activation.
   * it requires authentication.
   * @param createUserDto request body data containing user information for new user.
   * @param req HTTP request object.
   * @returns newly created user object, token for authentication and response status.
   * @throws ConflictException in case of email already exists in the database.
   */
  @Post('signup')
  @ApiOperation({
    description: 'Api to register new users.',
    summary:
      'Api to register new users. It taked (fullname, email and password) as input',
  })
  @ApiCreatedResponse({
    description: 'The user is successfully created',
    type: UserResponseDto,
  })
  @ApiConflictResponse({
    description: 'In case of email already exists in the database',
  })
  async signup(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const { user, token, refreshToken } = await this.authService.signup(
      createUserDto,
      req,
    );
    return {
      status: 'success',
      user,
      token,
      refreshToken,
    };
  }

  /**
   * Post API - "/login" - used for user login and get authentication token to access other protected APIs.
   * it requires the LoginUserDto object in request body.
   * @param req HTTP request object containing user information.
   * @returns newly logged in user object, token for authentication and response status.
   * @throws UnauthorizedException with message in case user is not logged in.
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  @UseInterceptors(TransformInterceptor)
  @ApiOperation({
    description: 'Api to login already registered user.',
    summary: 'Api to login already registered user.',
  })
  @ApiCreatedResponse({
    description: 'Login successful',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiBody({ required: true, type: LoginUserDto })
  async loginPassportLocal(@Req() req: Request) {
    console.log('inside loginPassportLocal');
    const user = req.user;

    const token = await this.authService.signToken(user);

    return { status: 'success', user, token };
  }

  /**
   * Get API - "/google" - used for login through google account. It redirects to Google OAuth Content Screen.
   * @param req HTTP request object.
   */
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    description: 'Api to login user through Google account.',
    summary: 'Api to login user through Google account.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirect to Google OAuth Content Screen',
  })
  @ApiOAuth2(['email', 'profile'])
  async loginGoogle(@Req() req: Request) {
    // NOTE: For UI:${req.protocol}://${req.get("host")}/auth/google_oauth2
  }

  /**
   * Get API - "/google/callback" - used for login through google account. It is a webhook hit by Google Auth services with user information.
   * @param req HTTP request object containing user information from google.
   * @returns created or logged in user object, token for authentication and response status.
   * @throws ConflictException if the user with that email already exists.
   * @throws UnauthorizedException if credentials are invalid.
   */
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOkResponse({
    description: 'Created or found Existing user and Login successful',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  @ApiConflictResponse({ description: 'User Already Exists' })
  @ApiOAuth2(['email', 'profile'])
  async loginGoogleRedirect(@Req() req: Request) {
    const { user, token } = await this.authService.loginGoogle(req);

    return {
      status: 'success',
      user,
      token,
    };
  }

  /**
   * Get API - "/logout" - used for logging out the user.
   * it requires authentication.
   * @returns null for token and response status.
   * @throws UnauthorizedException with message in case user is not logged in.
   */
  @Get('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    description: 'Api to logout logged in user.',
    summary: 'Api to logout logged in user.',
  })
  @ApiOkResponse({ description: 'Logout Successful', type: LogoutResponseDto })
  @ApiUnauthorizedResponse({ description: 'If User is not logged in' })
  @ApiBearerAuth()
  async logout() {
    return { status: 'success', token: null };
  }

  /**
   * Post API - "/forgot-password" - used for reseting the password in case the user forgets the password. it sends a mail with password reset URL to user's email.
   * @returns response status and response message "Password reset email sent successfully".
   * @throws NotFoundException if the user with given email is not found.
   */
  @Post('forgot-password')
  @ApiCreatedResponse({
    description: 'Create password reset token and send it to user email',
    type: MessageResponseDto,
  })
  @ApiOperation({
    description:
      "Api to reset the password in case the user forgets the password. it sends a mail with password reset URL to user's email.",
    summary:
      "Api to reset the password in case the user forgets the password. it sends a mail with password reset URL to user's email.",
  })
  @ApiNotFoundResponse({ description: 'User is not found' })
  async forgotPassword(
    @Body() forgotPassword: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    const status = await this.authService.forgotPassword(
      forgotPassword?.email,
      req,
    );

    if (!status) throw new InternalServerErrorException('Error sending email!');

    return {
      status: 'success',
      message: 'Password reset email sent successfully',
    };
  }

  /**
   * Get API - "/verify/:token" - used for pre-verification of the token before redirecting user to reset password page.
   * @param token reset password token.
   * @returns response status and response message.
   * @throws BadRequestException if the user with that email already exists.
   */
  @Get('verify/:token')
  @ApiOkResponse({ description: 'User Password Reset token verification' })
  @ApiOperation({
    description: 'Api to verify reset password token.',
    summary: 'Api to verify reset password token.',
  })
  @ApiBadRequestResponse({ description: 'In case of invalid or expired token' })
  async verifyToken(@Param('token') token: string) {
    const message = await this.authService.verifyToken(token);

    return { status: 'success', message };
  }

  /**
   * Get API - "/reset-password/:token" - used for reseting the password using the token received in the mail
   * @param token reset password token.
   * @param resetPassword contains new password to be set.
   * @returns updated user object, response status and response message.
   * @throws BadRequestException in case of invalid or expired token.
   * @throws NotAcceptableException if password and passwordConfirm does not match.
   */
  @Patch('reset-password/:token')
  @ApiOkResponse({
    description: 'User Password Reset was successful',
    type: UserResponseDto,
  })
  @ApiOperation({
    description: 'Api to reset users password.',
    summary: 'Api to reset users password.',
  })
  @ApiNotAcceptableResponse({
    description: 'If password and passwordConfirm does not match',
  })
  @ApiBadRequestResponse({ description: 'In case of invalid or expired token' })
  async resetPassword(
    @Param('token') token: string,
    @Body() resetPassword: ResetPasswordDto,
  ) {
    const { updatedUser, accessToken } = await this.authService.resetPassword(
      token,
      resetPassword,
    );
    return { status: 'success', user: updatedUser, token: accessToken };
  }

  /**
   * Patch API - "/update-my-password" - used for updating the user's password.
   * it requires authentication
   * @param user user information of current logged in user.
   * @param updateMyPassword contains current password and new password to be set.
   * @returns updated user object, authentication token and response status.
   * @throws BadRequestException if given new password and user password are same or if given new password and passwordConfirm are different.
   * @throws UnauthorizedException if User is not logged in OR If input password and user password does not match.
   */
  @Patch('update-my-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    description: 'Api to change password of current logged in user.',
    summary: 'Api to change password of current logged in user.',
  })
  @ApiOkResponse({
    description: 'Password Updated Successfully',
    type: UserResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'If User is not logged in OR If input password and user password does not match',
  })
  @ApiBadRequestResponse({
    description:
      'If given new password and user password are same OR if given new password and passwordConfirm are different',
  })
  @ApiBearerAuth()
  async updateMyPassword(
    @Body() updateMyPassword: UpdateMyPasswordDto,
    @GetUser() user: User,
  ) {
    const { user: updatedUser, accessToken: newToken } =
      await this.authService.updateMyPassword(updateMyPassword, user);

    return { status: 'success', user: updatedUser, token: newToken };
  }

  /**
   * Delete API - "/delete-me" - used for deleting the user's account.
   * it requires authentication
   * @param user user information of current logged in user.
   * @returns updated user object, authentication token and response status.
   * @throws BadRequestException if User does not exist.
   * @throws UnauthorizedException if User is not logged in.
   */
  @Delete('delete-me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    description: "Api to delete logged in user's account",
    summary: "Api to delete logged in user's account.",
  })
  @ApiOkResponse({
    description: 'User deletion successful',
    type: MessageResponseDto,
  })
  @ApiBadRequestResponse({ description: 'If User does not exist' })
  @ApiUnauthorizedResponse({ description: 'If User is not logged in' })
  @ApiBearerAuth()
  async deleteMyAccount(@GetUser() user: User) {
    const isDeleted: boolean = await this.authService.deleteMyAccount(user);

    if (isDeleted) {
      return { status: 'success', message: 'User Deleted Successfully' };
    }
  }

  /**
   * Get API - "/refresh" - used for getting the refresh token ( implementedd only for the email nd password ).
   * it requires refreshToken in authentication header
   * @param req HTTP request object.
   * @returns response { accessToken: string , refreshToken: string }
   */
  @Get('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth()
  async refresh(@Req() req: Request) {
    console.log(req.user);
    const userId = req.user['_id'];
    // const refreshToken = req.user['refreshToken'];
    return this.authService.refreshTokens(userId);
  }
}
