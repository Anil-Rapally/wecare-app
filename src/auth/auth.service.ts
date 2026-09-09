import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { AuthClaims, TokenPurpose } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(userId: string, purpose: TokenPurpose) {
    const expiresIn = 300;
    const token = await this.jwt.signAsync(
      { sub: userId, purpose },
      {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        algorithm: 'HS256',
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
        expiresIn,
      },
    );
    return { token, expiresIn };
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
