import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRoles } from 'src/user/enums/role.enum';

export class CreateUserDto {
  /**
   * Fullname of user
   */
  @ApiProperty({ required: true, description: 'Fullname of user' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  /**
   * Email of user
   */
  @ApiProperty({ required: true, description: 'Email of user' })
  @IsEmail()
  @IsString({ message: 'Email can not be only numbers' })
  @IsNotEmpty()
  email: string;

  /**
   * Password user wants provide
   */
  @IsNotEmpty()
  @MinLength(8, { message: 'password must contain minimum of 8 characters' })
  @MaxLength(32, { message: 'password must contain maximum of 32 characters' })
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Weak Password',
  })
  @ApiProperty({ required: true, description: 'Password user wants provide' })
  password: string;

  /**
   * Role of user
   * @example "admin"
   */
  @ApiPropertyOptional({ description: 'Role of user' })
  @IsNotEmpty()
  @IsArray()
  roles: UserRoles[];
}
