import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Authentication guard for Local passport Strategy
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {}
