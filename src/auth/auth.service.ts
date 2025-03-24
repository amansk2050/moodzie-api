import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { Request } from 'express';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateMyPasswordDto } from './dto/update-password.dto';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { argon2hash, argon2verify } from './argon2/argon2';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';

/**
 * This service contain contains all methods and business logic for authentication such as login, signup, password reset, etc.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger('AUTH');

  private _FR_HOST: string;

  /**
   *  returns the frontend host URL.
   */
  public get FR_HOST(): string {
    return this._FR_HOST;
  }

  /**
   *  used to set the frontend host URL.
   *  @param value the URL to the frontend host.
   */
  public set FR_HOST(value: string) {
    this._FR_HOST = value;
  }

  /**
   * Constructor of `AuthService` class
   * @param userRepository
   * @param jwtService imported from "@nestjs/jwt"
   * @param mailService
   * @param configService
   */
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.FR_HOST = configService.get(
      `FR_BASE_URL_${configService.get('STAGE').toUpperCase()}`,
    );
  }

  /**
   * used for signing up the user and send mail with activation token to the given email for account activation.
   * @param createUserDto object containing user information.
   * @param req HTTP request object.
   * @returns user object containing information about user and token which is used for authentication.
   */
  async signup(
    createUserDto: CreateUserDto,
    req: Request,
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    this.logger.log('Create and Save user');
    const { user, activateToken } =
      await this.userService.createUser(createUserDto);
    const tokens = await this.getTokens(user);
    console.log({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });

    this.logger.log('user created');
    this.logger.log('Login the user and send the token and mail');
    await this.signTokenSendEmailAndSMS(user, req, activateToken);

    return {
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * used by passport for authentication by finding the user and matching password.
   * @param loginUserDto object containing email and phone of a user.
   * @returns if authenticated it returns user object otherwise returns null
   */
  async loginPassport(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    this.logger.log('Searching User with provided email');
    const user = await this.userRepository.findOne({ where: { email } });

    console.log('AuthService -> loginPassport -> user');

    this.logger.log('Verifying User');
    if (user && (await argon2verify(user.password, password))) {
      return user;
    }

    return null;
  }

  /**
   * used by passport for google authentication.
   * @param req http request object containing user details provided by google.
   * @returns user object containing information about user and token which is used for authentication.
   */
  async loginGoogle(req: Request) {
    if (!req.user) {
      throw new NotFoundException('User Not Found');
    }

    const { existingUser, sendMail, newUser, activateToken } =
      await this.userService.createOrFindUserGoogle(req.user);

    let user: User, token: string;
    if (existingUser) user = existingUser;
    else user = newUser;

    if (sendMail) {
      await this.signTokenSendEmailAndSMS(user, req, activateToken);
    } else {
      this.logger.log('Existing User, Logging In');
      const { accessToken } = await this.signToken(user);
    }

    return {
      user,
      token,
    };
  }

  /**
   * used for signing a JWT token with user id as payload.
   * @param user http request object containing user details provided by google.
   * @returns signed token which is used for authentication.
   */
  async signToken(user: any) {
    const userObj: User = await this.userService.getUserById(user._id);

    return await this.getTokens(userObj);
  }

  /**
   * sends password reset token to given email for resetting password if user account associated to that email is found.
   * @param email email associated with user account
   * @param req HTTP request object.
   * @returns signed token which is used for authentication.
   */
  async forgotPassword(email: string, req: Request) {
    this.logger.log('Searching User with provided email');
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User Not Found');
    }

    this.logger.log('Creating password reset token');
    const resetToken: string =
      await this.userService.createPasswordResetToken(user);

    const resetURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/auth/reset-password/${resetToken}`;
    //NOTE: FOR UI
    // const resetURL = `${req.protocol}://${req.get("host")}/resetPassword/${resetToken}`;
    // const resetURL = `${this.FR_HOST}/auth/reset-password/${resetToken}`;

    try {
      this.logger.log('Sending password reset token mail');
      // this.mailService.sendForgotPasswordMail(email, resetURL);

      return true;
    } catch (err) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await this.userRepository.save(user);
      return false;
    }
  }

  /**
   * verifies the given password rest token by comparing it with token stored in user object and making sure it's not expired.
   * @param token password reset token that is sent over the mail to the user in forgotPassword.
   * @returns a string "valid token" if the token is valid.
   */
  async verifyToken(token: string) {
    this.logger.log('Generating hash from token');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    this.logger.log('Retrieving user');
    const user: User = await this.userRepository.findOne({
      where: { passwordResetToken: hashedToken },
    });

    if (!user)
      throw new BadRequestException(
        "The user belonging to this token doesn't exist",
      );

    this.logger.log('Checking if token is valid');
    const resetTime: number = +user.passwordResetExpires;
    if (Date.now() >= resetTime) {
      throw new BadRequestException('Invalid token or token expired');
    }

    return 'valid token';
  }

  /**
   * used to reset user password. it verifies the given password reset token and if verified updates the user password.
   * @param token password reset token that is sent over the mail to the user in forgotPassword.
   * @param resetPassword contains new password to be set.
   * @returns a string "valid token" if the token is valid.
   */
  async resetPassword(token: string, resetPassword: ResetPasswordDto) {
    const { password, passwordConfirm } = resetPassword;

    this.logger.log('Checking Password equality');
    if (password !== passwordConfirm) {
      throw new NotAcceptableException(
        'password and passwordConfirm should match',
      );
    }

    this.logger.log('Generating hash from token');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    this.logger.log('Retrieving user');
    const user: User = await this.userRepository.findOne({
      where: { passwordResetToken: hashedToken },
    });

    if (!user) throw new BadRequestException('Invalid token or token expired');

    this.logger.log('Checking if token is valid');
    const resetTime: number = +user.passwordResetExpires;
    if (Date.now() >= resetTime) {
      throw new BadRequestException('Invalid token or token expired');
    }

    this.logger.log('Hashing the password');
    user.password = await argon2hash(password);

    user.passwordResetExpires = null;
    user.passwordResetToken = null;

    this.logger.log('Update the user password');
    const updatedUser: User = await this.userRepository.save(user);

    const { accessToken } = await this.signToken(updatedUser);

    this.logger.log('Sending reset password confirmation mail');
    // this.mailService.sendPasswordResetConfirmationMail(user);

    return { updatedUser, accessToken };
  }

  /**
   * used to update user password. it verifies the current user password and update the new password.
   * @param updateMyPassword password reset token that is sent over the mail to the user in forgotPassword.
   * @param user user object containg user information of current logged in user.
   * @returns updated user object containing user information and token which is used for authentication.
   */
  async updateMyPassword(updateMyPassword: UpdateMyPasswordDto, user: User) {
    const { passwordCurrent, password, passwordConfirm } = updateMyPassword;

    this.logger.log('Verifying current password from user');
    if (!(await argon2verify(user.password, passwordCurrent))) {
      throw new UnauthorizedException('Invalid password');
    }

    if (password === passwordCurrent) {
      throw new BadRequestException(
        'New password and old password can not be same',
      );
    }

    if (password !== passwordConfirm) {
      throw new BadRequestException(
        'Password does not match with passwordConfirm',
      );
    }

    this.logger.log('Masking Password');
    const hashedPassword = await argon2hash(password);
    user.password = hashedPassword;

    this.logger.log('Saving Updated User');
    await this.userRepository.save(user);

    this.logger.log('Sending password update mail');
    // this.mailService.sendPasswordUpdateEmail(user);

    this.logger.log('Login the user and send the token again');
    const { accessToken } = await this.signToken(user);
    return { user, accessToken };
  }

  /**
   * used for deleting user account. Method implementation to be completed by developer.
   * @param user user object containg user information of current logged in user.
   * @returns updated user object containing user information and token which is used for authentication.
   */
  async deleteMyAccount(user: User): Promise<boolean> {
    // TODO: Method to be implemented by developer
    throw new BadRequestException('Method not implemented.');
  }

  /**
   * sends account activation URL in a welcome mail to the given user.
   * @param user user object containg user information.
   * @param activateToken account activation token.
   * @param req HTTP request object.
   * @returns signed JWT token which is used for authentication.
   */
  private async signTokenSendEmailAndSMS(
    user: User,
    req: Request,
    activateToken: string,
  ) {
    this.logger.log('User Created');

    const activeURL = `${req.protocol}://${req.get(
      'host',
    )}/api/v1/auth/activate/${activateToken}`;
    //NOTE: FOR UI
    // const activeURL = `${req.protocol}://${req.get("host")}/activate/${activateToken}`;
    // const activeURL = `${this.FR_HOST}/auth/activate/${activateToken}`;

    this.logger.log('Sending welcome email');
    // this.mailService.sendUserConfirmationMail(user, activeURL);

    // TODO: Send confirmation SMS to new user using Twilio
  }

  /**
   * return access nd refresh tokens
   * @param user user object containg user information.
   * @returns signed JWT token which is used for authentication.
   */
  private async getTokens(user: User) {
    const [accessToken, refreshToken] = await Promise.all([
      this.getAccessToken({ id: user.id }),
      this.updateRefreshToken(user),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * return access token
   * @param id userId store as payload in token
   * @returns signed JWT token which is used for authentication.
   */
  private async getAccessToken({ id }) {
    return this.jwtService.signAsync(
      {
        id,
      },
      {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('EXPIRES_IN_ACCESS'),
      },
    );
  }

  /**
   * return refresh token
   * @param user user Object to modify the refresh token
   * @returns signed JWT token which is used for authentication.
   */
  private async updateRefreshToken(user: User) {
    const refreshToken = this.jwtService.sign(
      {
        id: user.id,
      },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('EXPIRES_IN_REFRESH'),
      },
    );
    user.refreshToken = refreshToken;
    await this.userRepository.save(user);
    return refreshToken;
  }

  /**
   * return access token
   * @param userId userId store as payload in token
   * @returns signed JWT token which is used for authentication.
   */

  async refreshTokens(userId: string) {
    const user = await this.userService.getUserById(userId);
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Access Denied');
    // const refreshTokenMatches = user.refreshToken === refreshToken;
    // if (!refreshTokenMatches) throw new UnauthorizedException('Access Denied');
    const tokens = await this.getTokens(user);
    await this.updateRefreshToken(user);
    return tokens;
  }
}
