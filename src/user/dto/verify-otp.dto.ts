import { IsString, IsUUID, Matches } from 'class-validator';
import { LoginDto } from './login.dto';

export class VerifyOtpDto extends LoginDto {
  @IsUUID('4')
  otpid!: string;

  @IsString()
  @Matches(/^\d{4}$/)
  otp!: string;
}
