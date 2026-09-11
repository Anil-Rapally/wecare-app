import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuthService } from '../auth/auth.service';
import { MailService } from './mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailOtp } from './entity/email-otp.entity';
import { checkOtp, issueOtp } from './otp/otp.service';
import type { OtpFailure } from './otp/otp.types';
import { OTP_MIN_DELAY_SECONDS, OTP_TTL_SECONDS } from './otp/otp.types';
import { PhotoService } from './photo/photo.service';
import { User } from './entity/user.entity';


@Injectable()
export class UserService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(EmailOtp) private readonly otps: Repository<EmailOtp>,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly authService: AuthService,
    private readonly photos: PhotoService,
  ) { }

  async login(dto: LoginDto) {
    const pending = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const otps = manager.getRepository(EmailOtp);

      // On a duplicate email, update only the email to its same canonical value.
      // MySQL takes a write lock; existing flags and profile fields stay intact.
      await users
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({ email: dto.email })
        .orUpdate(['email'], ['email'])
        .execute();
      const user = await users.findOneOrFail({
        where: { email: dto.email },
        lock: { mode: 'pessimistic_write' },
      });
      const state = (await otps.findOneBy({ userId: user.id })) ?? otps.create({ userId: user.id });
      const result = issueOtp(state, this.config.getOrThrow<string>('OTP_HMAC_SECRET'));
      await otps.save(state);
      if (!result.ok) return result;
      return { userId: user.id, email: user.email, ...result };
    });

    if (!pending.ok) this.throwOtpFailure(pending);

    // Email delivery is outside the transaction so SMTP cannot hold DB locks.
    try {
      await this.mail.sendOtp(pending.email, pending.otp);
    } catch {
      // A failed older delivery must not invalidate a newer resend.
      await this.otps.update(
        { userId: pending.userId, otpId: pending.otpId },
        { codeHash: null, expiresAt: null },
      );
      throw new ServiceUnavailableException({
        code: 'OTP_SEND_FAILED',
        message: "Failed to send OTP. Please try again later.",
        retryAfter: OTP_MIN_DELAY_SECONDS,
      });
    }
    // Do not disclose account/profile existence to someone who only knows an email.
    return {
      message: 'OTP sent to your email.',
      otpId: pending.otpId,
      expiresIn: OTP_TTL_SECONDS,
      resendAfter: OTP_MIN_DELAY_SECONDS,
      nextStep: 'verify_otp' as const,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const result = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const otps = manager.getRepository(EmailOtp);
      const user = await users.findOne({
        where: { email: dto.email },
        lock: { mode: 'pessimistic_write' },
      });
      const invalid: OtpFailure = {
        ok: false,
        status: 401,
        code: 'INVALID_OR_EXPIRED_OTP',
        message: "The code is invalid, expired, or already used.",
      };
      if (!user) return invalid;
      const state = await otps.findOneBy({ userId: user.id });
      if (!state) return invalid;
      const verified = checkOtp(
        state,
        this.config.getOrThrow<string>('OTP_HMAC_SECRET'),
        dto.otpId,
        dto.otp,
      );

      // Save failed attempts too. Throwing inside this transaction would undo them.
      await otps.save(state);
      if (!verified.ok) return verified;
      user.isEmailVerified = true;
      await users.save(user);
      return { ok: true as const, user };
    });
    if (!result.ok) this.throwOtpFailure(result);

    const user = result.user;
    const purpose = user.isProfileExists ? 'access' : 'signup';
    const issued = await this.authService.issue(user.id, purpose);
    const common = {
      isEmailVerified: user.isEmailVerified,
      isProfileExists: user.isProfileExists,
      tokenType: 'Bearer',
      expiresIn: issued.expiresIn,
      user: this.publicUser(user),
    };
    if (user.isProfileExists) {
      return {
        ...common,
        message: "Login successful.",
        nextStep: 'dashboard',
        accessToken: issued.token,
      };
    }
    return {
      ...common,
      message: "Email verified. Complete your profile.",
      nextStep: 'signup',
      signupToken: issued.token,
    };
  }

  async createUser(userId: string, dto: CreateUserDto) {
    if (dto.dateOfBirth > new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException("Date of birth cannot be in the future.");
    }
    const user = await this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!user?.isEmailVerified) throw new UnauthorizedException("Please verify your email first.");
      if (user.isProfileExists) throw new ConflictException("Profile already exists.");
      // Identity comes from the verified token. The body cannot set email or flags.
      user.fullName = dto.fullName;
      user.dateOfBirth = dto.dateOfBirth;
      user.gender = dto.gender;
      user.bloodGroup = dto.bloodGroup;
      user.emergencyContact = dto.emergencyContact;
      user.address = dto.address || null;
      user.isProfileExists = true;
      return users.save(user);
    });
    const issued = await this.authService.issue(user.id, 'access');
    return {
      message: "Profile created successfully.",
      isEmailVerified: user.isEmailVerified,
      isProfileExists: user.isProfileExists,
      accessToken: issued.token,
      tokenType: 'Bearer',
      expiresIn: issued.expiresIn,
      nextStep: 'upload_photo',
      user: this.publicUser(user),
    };
  }

  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    const jpeg = await this.photos.sanitize(file.buffer);
    const result = await this.users.update(
      {
        id: userId,
        isEmailVerified: true,
        isProfileExists: true,
      },
      { profilePhoto: jpeg, profilePhotoUrl: '/user/profile-photo' },
    );
    if (!result.affected) throw new ForbiddenException("A completed profile is required.");
    return {
      message: "Profile updated successfully.",
      isEmailVerified: true,
      isProfileExists: true,
      profilePhotoUrl: '/user/profile-photo',
      nextStep: 'dashboard',
    };
  }

  async getProfilePhoto(userId: string): Promise<Buffer> {
    const user = await this.users
      .createQueryBuilder('user')
      .select('user.id')
      .addSelect('user.profilePhoto')
      .where('user.id = :userId', { userId })
      .getOne();
    if (!user?.profilePhoto) throw new NotFoundException("No profile photo has been uploaded.");
    return user.profilePhoto;
  }

  publicUser(user: User) {
    // Explicit projection keeps photo bytes and authentication state out of JSON.
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      emergencyContact: user.emergencyContact,
      address: user.address,
      profilePhotoUrl: user.profilePhotoUrl,
    };
  }

  private throwOtpFailure(failure: OtpFailure): never {
    const { ok: _ok, status, ...body } = failure;
    throw new HttpException(body, status);
  }
}
