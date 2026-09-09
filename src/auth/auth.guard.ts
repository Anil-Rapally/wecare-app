import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest, TokenPurpose } from './auth.types';
import { User } from '../user/entity/user.entity';

const PURPOSE_KEY = 'auth:purpose';

export const RequirePurpose = (purpose: TokenPurpose) => SetMetadata(PURPOSE_KEY, purpose);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = request.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match) throw new UnauthorizedException('A Bearer token is required.');
    const claims = await this.authService.verify(match[1]);
    const purpose =
      this.reflector.getAllAndOverride<TokenPurpose>(PURPOSE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'access';
    if (claims.purpose !== purpose) {
      throw new ForbiddenException(`This endpoint requires a ${purpose} token.`);
    }
    const user = await this.users.findOneBy({ id: claims.sub });
    if (!user?.isEmailVerified) throw new UnauthorizedException('Email verification is required.');
    if (purpose === 'signup' && user.isProfileExists) {
      throw new ConflictException('Profile already exists. Please log in again.');
    }
    if (purpose === 'access' && !user.isProfileExists) {
      throw new ForbiddenException('Complete your profile first.');
    }
    request.authUser = user;
    return true;
  }
}
