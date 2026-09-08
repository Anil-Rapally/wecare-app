import {
  CanActivate,
  ConflictException,
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import type { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';

export type TokenPurpose = 'signup' | 'access';
export interface AuthClaims {
  sub: string;
  purpose: TokenPurpose;
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string, purpose: TokenPurpose) {
    const expires_in = 300;
    const token = await this.jwt.signAsync(
      { sub: userId, purpose },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithm: 'HS256',
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
        expiresIn: expires_in,
      },
    );
    return { token, expires_in };
  }

  async verify(token: string): Promise<AuthClaims> {
    try {
      const claims = await this.jwt.verifyAsync<AuthClaims>(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithms: ['HS256'],
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      });
      if (
        !claims ||
        !isUUID(claims.sub, '4') ||
        !['signup', 'access'].includes(claims.purpose) ||
        typeof claims.exp !== 'number'
      )
        throw new Error('Invalid claims');
      return claims;
    } catch {
      throw new UnauthorizedException('Invalid or expired token. Verify your email again.');
    }
  }
}

const PURPOSE_KEY = 'auth:purpose';
export const RequirePurpose = (purpose: TokenPurpose) => SetMetadata(PURPOSE_KEY, purpose);
export interface AuthenticatedRequest extends Request {
  auth_user: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth_user,
);

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly tokens: TokenService,
    private readonly reflector: Reflector,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const match = request.headers.authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match) throw new UnauthorizedException('A Bearer token is required.');
    const claims = await this.tokens.verify(match[1]);
    const purpose =
      this.reflector.getAllAndOverride<TokenPurpose>(PURPOSE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? 'access';
    if (claims.purpose !== purpose) {
      throw new ForbiddenException(`This endpoint requires a ${purpose} token.`);
    }
    const user = await this.users.findOneBy({ id: claims.sub });
    if (!user?.is_email_verified)
      throw new UnauthorizedException('Email verification is required.');
    if (purpose === 'signup' && user.is_profile_exists) {
      throw new ConflictException('Profile already exists. Please log in again.');
    }
    if (purpose === 'access' && !user.is_profile_exists) {
      throw new ForbiddenException('Complete your profile first.');
    }
    request.auth_user = user;
    return true;
  }
}