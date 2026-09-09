import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { MailService } from './mail/mail.service';
import { EmailOtp } from './entity/email-otp.entity';
import { PhotoService } from './photo/photo.service';
import { UserController } from './user.controller';
import { User } from './entity/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, EmailOtp]), AuthModule],
  controllers: [UserController],
  providers: [UserService, MailService, PhotoService],
})
export class UserModule {}
