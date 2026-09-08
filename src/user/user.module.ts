import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenGuard } from '../guards/token.guard';
import { TokenService } from '../guards/token.guard';
import { EmailOtp } from '../entity/user.entity';
import { MailService } from '../mail/mail.service';
import { PhotoService } from '../photo/photo.services';
import { UserController } from './user.controller';
import { User } from '../entity/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmailOtp]), JwtModule.register({})],
  controllers: [UserController],
  providers: [UserService, MailService, PhotoService, TokenService, TokenGuard],
  exports: [TokenGuard, TokenService],
})
export class UserModule {}