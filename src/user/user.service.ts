import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
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
import { TokenService } from '../guards/token.guard';
import { EmailOtp } from '../entity/user.entity';
import { MailService } from '../mail/mail.service';
import { PhotoService } from '../photo/photo.services';
import { CreateUserDto, LoginDto, VerifyOtpDto } from '../dto/user.dto';
import { User } from '../entity/user.entity';

@Injectable()
export class UserService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(User) private readonly users: Repository<User>,
        @InjectRepository(EmailOtp) private readonly otps: Repository<EmailOtp>,
        private readonly config: ConfigService,
        private readonly mail: MailService,
        private readonly tokens: TokenService,
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
            const state =
                (await otps.findOneBy({ user_id: user.id })) ?? otps.create({ user_id: user.id });
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
                { user_id: pending.userId, otpid: pending.otpid },
                { code_hash: null, expires_at: null },
            );
            throw new ServiceUnavailableException({
                code: 'OTP_SEND_FAILED',
                message: 'Failed to send OTP. Please try again later.',
                retry_after: OTP_MIN_DELAY_SECONDS,
            });
        }
        // Do not disclose account/profile existence to someone who only knows an email.
        return {
            message: 'OTP sent to your email.',
            otpid: pending.otpid,
            expires_in: OTP_TTL_SECONDS,
            resend_after: OTP_MIN_DELAY_SECONDS,
            next_step: 'verify_otp' as const,
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
                message: 'The code is invalid, expired, or already used.',
            };
            if (!user) return invalid;
            const state = await otps.findOneBy({ user_id: user.id });
            if (!state) return invalid;
            const verified = checkOtp(
                state,
                this.config.getOrThrow<string>('OTP_HMAC_SECRET'),
                dto.otpid,
                dto.otp,
            );

            // Save failed attempts too. Throwing inside this transaction would undo them.
            await otps.save(state);
            if (!verified.ok) return verified;
            user.is_email_verified = true;
            await users.save(user);
            return { ok: true as const, user };
        });
        if (!result.ok) this.throwOtpFailure(result);

        const user = result.user;
        const purpose = user.is_profile_exists ? 'access' : 'signup';
        const issued = await this.tokens.issue(user.id, purpose);
        const common = {
            is_email_verified: user.is_email_verified,
            is_profile_exists: user.is_profile_exists,
            token_type: 'Bearer',
            expires_in: issued.expires_in,
            user: this.publicUser(user),
        };
        if (user.is_profile_exists) {
            return {
                ...common,
                message: 'Login successful.',
                next_step: 'dashboard',
                access_token: issued.token,
            };
        }
        return {
            ...common,
            message: 'Email verified. Complete your profile.',
            next_step: 'signup',
            signup_token: issued.token,
        };
    }

    async createUser(userId: string, dto: CreateUserDto) {
        if (dto.date_of_birth > new Date().toISOString().slice(0, 10)) {
            throw new BadRequestException('date_of_birth cannot be in the future.');
        }
        const user = await this.dataSource.transaction(async (manager) => {
            const users = manager.getRepository(User);
            const user = await users.findOne({
                where: { id: userId },
                lock: { mode: 'pessimistic_write' },
            });
            if (!user?.is_email_verified) throw new UnauthorizedException('Verify your email first.');
            if (user.is_profile_exists) throw new ConflictException('Profile already exists.');
            // Identity comes from the verified token. The body cannot set email or flags.
            user.full_name = dto.full_name;
            user.date_of_birth = dto.date_of_birth;
            user.gender = dto.gender;
            user.blood_group = dto.blood_group;
            user.emergency_contact = dto.emergency_contact;
            user.address = dto.address || null;
            user.is_profile_exists = true;
            return users.save(user);
        });
        const issued = await this.tokens.issue(user.id, 'access');
        return {
            message: 'Profile created successfully.',
            is_email_verified: user.is_email_verified,
            is_profile_exists: user.is_profile_exists,
            access_token: issued.token,
            token_type: 'Bearer',
            expires_in: issued.expires_in,
            next_step: 'upload_photo',
            user: this.publicUser(user),
        };
    }

    async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
        const jpeg = await this.photos.sanitize(file.buffer);
        const result = await this.users.update(
            {
                id: userId,
                is_email_verified: true,
                is_profile_exists: true,
            },
            { profile_photo: jpeg, profile_photo_url: '/user/profile-photo' },
        );
        if (!result.affected) throw new ForbiddenException('A completed profile is required.');
        return {
            message: 'Profile photo uploaded successfully.',
            is_email_verified: true,
            is_profile_exists: true,
            profile_photo_url: '/user/profile-photo',
            next_step: 'dashboard',
        };
    }

    async getProfilePhoto(userId: string): Promise<Buffer> {
        const user = await this.users
            .createQueryBuilder('user')
            .select('user.id')
            .addSelect('user.profile_photo')
            .where('user.id = :userId', { userId })
            .getOne();
        if (!user?.profile_photo) throw new NotFoundException('No profile photo has been uploaded.');
        return user.profile_photo;
    }

    publicUser(user: User) {
        // Explicit projection keeps photo bytes and authentication state out of JSON.
        return {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            date_of_birth: user.date_of_birth,
            gender: user.gender,
            blood_group: user.blood_group,
            emergency_contact: user.emergency_contact,
            address: user.address,
            profile_photo_url: user.profile_photo_url,
        };
    }

    private throwOtpFailure(failure: OtpFailure): never {
        const { ok: _ok, status, ...body } = failure;
        throw new HttpException(body, status);
    }
}

// OTP helpers live here to match the requested project layout.
export const OTP_TTL_SECONDS = 300;
export const OTP_SEND_BLOCK_SECONDS = 120;
export const OTP_MIN_DELAY_SECONDS = 15;
export const MAX_SENDS_PER_WINDOW = 3;
export const MAX_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type OtpFailure = {
    ok: false;
    status: 401 | 429;
    code: 'INVALID_OR_EXPIRED_OTP' | 'TOO_MANY_ATTEMPTS' | 'RESEND_TOO_SOON' | 'EMAIL_SEND_LIMIT';
    message: string | string[];
    retry_after?: number;
};

function blocked(until: Date, now: number): OtpFailure {
    return {
        ok: false,
        status: 429,
        code: 'TOO_MANY_ATTEMPTS',
        message: 'Too many attempts. Please wait before requesting another code.',
        retry_after: Math.max(1, Math.ceil((until.getTime() - now) / 1000)),
    };
}

function resetExpiredFailures(state: EmailOtp, now: number): void {
    if (
        (state.locked_until && state.locked_until.getTime() <= now) ||
        (!state.locked_until &&
            state.failure_window_started_at &&
            now - state.failure_window_started_at.getTime() >= FAILURE_WINDOW_MS)
    ) {
        state.failed_attempts = 0;
        state.failure_window_started_at = null;
        state.locked_until = null;
    }
}

export function hashOtp(secret: string, userId: string, otpId: string, code: string): string {
    return createHmac('sha256', secret).update(`${userId}:${otpId}:${code}`).digest('hex');
}

// Mutates a locked database row. The caller must save it in its transaction.
export function issueOtp(
    state: EmailOtp,
    secret: string,
    now = Date.now(),
): OtpFailure | { ok: true; otp: string; otpid: string } {
    if (state.locked_until && state.locked_until.getTime() > now) {
        return blocked(state.locked_until, now);
    }
    if (state.locked_until && state.locked_until.getTime() <= now) {
        state.locked_until = null;
        state.send_count = 0;
        state.send_window_started_at = null;
        state.last_sent_at = null;
    }
    resetExpiredFailures(state, now);
    if (state.send_count >= MAX_SENDS_PER_WINDOW) {
        state.locked_until = new Date(now + OTP_SEND_BLOCK_SECONDS * 1000);
        return {
            ok: false,
            status: 429,
            code: 'EMAIL_SEND_LIMIT',
            message: [
                'Too many Attempts',
                'please wait before requesting another verification code to continue',
            ],
            retry_after: OTP_SEND_BLOCK_SECONDS,
        };
    }
    if (state.last_sent_at) {
        const nextAllowedAt = state.last_sent_at.getTime() + OTP_MIN_DELAY_SECONDS * 1000;
        if (now < nextAllowedAt) {
            return {
                ok: false,
                status: 429,
                code: 'RESEND_TOO_SOON',
                message: 'Please wait before requesting another verification code.',
                retry_after: Math.ceil((nextAllowedAt - now) / 1000),
            };
        }
    }
    const otp = randomInt(0, 10_000).toString().padStart(4, '0');
    const otpid = randomUUID();
    state.otpid = otpid;
    state.code_hash = hashOtp(secret, state.user_id, otpid, otp);
    state.expires_at = new Date(now + OTP_TTL_SECONDS * 1000);
    state.last_sent_at = new Date(now);
    state.send_count += 1;
    // Resending must not grant another five guesses.
    return { ok: true, otp, otpid };
}

export function checkOtp(
    state: EmailOtp,
    secret: string,
    otpId: string,
    code: string,
    now = Date.now(),
): OtpFailure | { ok: true } {
    if (state.locked_until && state.locked_until.getTime() > now) {
        return blocked(state.locked_until, now);
    }
    resetExpiredFailures(state, now);
    const invalid: OtpFailure = {
        ok: false,
        status: 401,
        code: 'INVALID_OR_EXPIRED_OTP',
        message: 'The code is invalid, expired, or already used.',
    };
    if (
        !state.code_hash ||
        !state.expires_at ||
        state.expires_at.getTime() <= now ||
        state.otpid !== otpId
    )
        return invalid;

    const received = Buffer.from(hashOtp(secret, state.user_id, otpId, code), 'hex');
    const stored = Buffer.from(state.code_hash, 'hex');
    if (stored.length !== received.length || !timingSafeEqual(stored, received)) {
        state.failure_window_started_at ??= new Date(now);
        state.failed_attempts += 1;
        if (state.failed_attempts >= MAX_ATTEMPTS) {
            state.locked_until = new Date(now + FAILURE_WINDOW_MS);
            state.code_hash = null;
            state.expires_at = null;
            return blocked(state.locked_until, now);
        }
        return invalid;
    }
    // Consumption happens before the surrounding transaction commits.
    state.code_hash = null;
    state.expires_at = null;
    state.failed_attempts = 0;
    state.failure_window_started_at = null;
    state.locked_until = null;
    return { ok: true };
}