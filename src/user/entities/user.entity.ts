import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRoles } from '../enums/role.enum';

/**
 * It describes the schema for user table in database.
 */
@Entity('user_details')
export class User {
  /**
   * auto-generated unique uuid primary key for the table.
   */
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  /**
   * googleId of the user user for google auth.
   */
  @Column({ unique: true, default: null })
  @Exclude({ toPlainOnly: true })
  googleID: string;

  /**
   * full name  of user.
   */
  @Column({ length: 50 })
  @ApiProperty()
  fullName: string;

  /**
   * email address of user.
   */
  @Column({ unique: true, length: 100 })
  @ApiProperty()
  email: string;

  /**
   * hashed password of user.
   */
  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  password: string;

  /**
   * password reset Token for password reset methods.
   */
  @Column({ default: null })
  @Exclude({ toPlainOnly: true })
  passwordResetToken: string;

  /**
   * password reset token Expiration time .
   */
  @Column({ default: null })
  @Exclude({ toPlainOnly: true })
  passwordResetExpires: string;

  /**
   * refresh token for user.
   */
  @Column({ default: null })
  @Exclude({ toPlainOnly: true })
  refreshToken: string;

  /**
   * role of user. default is UserRoles.USER.
   */
  @Column('enum', {
    array: true,
    enum: UserRoles,
    default: `{${UserRoles.NORMAL}}`,
  })
  @ApiProperty({
    enum: UserRoles,
    default: [UserRoles.NORMAL],
  })
  roles: UserRoles[];
  /**
   * timestamp for date of user creation.
   */
  @CreateDateColumn()
  @ApiProperty()
  createdAt: Date;

  /**
   * timestamp for date of user information updation.
   */
  @UpdateDateColumn()
  @ApiProperty()
  updatedAt: Date;
}
