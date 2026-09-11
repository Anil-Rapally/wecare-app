import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { EmailOtp } from '../entity/email-otp.entity';
import type { OtpFailure } from './otp.types';
import {
  MAX_ATTEMPTS,
  MAX_SENDS_PER_WINDOW,
  OTP_MIN_DELAY_SECONDS,
  OTP_SEND_BLOCK_SECONDS,
  OTP_TTL_SECONDS,
} from './otp.types';


const FAILURE_WINDOW_MS = 15 * 60 * 1000;

function blocked(until: Date, now: number): OtpFailure {
  return {
    ok: false,
    status: 429,
    code: 'TOO_MANY_ATTEMPTS',
    message: 'Too many attempts. Please wait before requesting another code.',
    retryAfter: Math.max(1, Math.ceil((until.getTime() - now) / 1000)),
  };
}

function resetExpiredFailures(state: EmailOtp, now: number): void {
  if (
    (state.lockedUntil && state.lockedUntil.getTime() <= now) ||
    (!state.lockedUntil &&
      state.failureWindowStartedAt &&
      now - state.failureWindowStartedAt.getTime() >= FAILURE_WINDOW_MS)
  ) {
    state.failedAttempts = 0;
    state.failureWindowStartedAt = null;
    state.lockedUntil = null;
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
): OtpFailure | { ok: true; otp: string; otpId: string } {
  if (state.lockedUntil && state.lockedUntil.getTime() > now) {
    return blocked(state.lockedUntil, now);
  }
  if (state.lockedUntil && state.lockedUntil.getTime() <= now) {
    state.lockedUntil = null;
    state.sendCount = 0;
    state.sendWindowStartedAt = null;
    state.lastSentAt = null;
  }
  resetExpiredFailures(state, now);
  if (state.sendCount >= MAX_SENDS_PER_WINDOW) {
    state.lockedUntil = new Date(now + OTP_SEND_BLOCK_SECONDS * 1000);
    return {
      ok: false,
      status: 429,
      code: 'EMAIL_SEND_LIMIT',
      message: [
        'Too many Attempts',
        'please wait before requesting another verification code to continue',
      ],
      retryAfter: OTP_SEND_BLOCK_SECONDS,
    };
  }
  if (state.lastSentAt) {
    const nextAllowedAt = state.lastSentAt.getTime() + OTP_MIN_DELAY_SECONDS * 1000;
    if (now < nextAllowedAt) {
      return {
        ok: false,
        status: 429,
        code: 'RESEND_TOO_SOON',
        message: 'Please wait before requesting another verification code.',
        retryAfter: Math.ceil((nextAllowedAt - now) / 1000),
      };
    }
  }
  const otp = randomInt(0, 10_000).toString().padStart(4, '0');
  const otpId = randomUUID();
  state.otpId = otpId;
  state.codeHash = hashOtp(secret, state.userId, otpId, otp);
  state.expiresAt = new Date(now + OTP_TTL_SECONDS * 1000);
  state.lastSentAt = new Date(now);
  state.sendCount += 1;
  // Resending must not grant another five guesses.
  return { ok: true, otp, otpId };
}

export function checkOtp(
  state: EmailOtp,
  secret: string,
  otpId: string,
  code: string,
  now = Date.now(),
): OtpFailure | { ok: true } {
  if (state.lockedUntil && state.lockedUntil.getTime() > now) {
    return blocked(state.lockedUntil, now);
  }
  resetExpiredFailures(state, now);
  const invalid: OtpFailure = {
    ok: false,
    status: 401,
    code: 'INVALID_OR_EXPIRED_OTP',
    message: 'The code is invalid, expired, or already used',
  };
  if (
    !state.codeHash ||
    !state.expiresAt ||
    state.expiresAt.getTime() <= now ||
    state.otpId !== otpId
  )
    return invalid;

  const received = Buffer.from(hashOtp(secret, state.userId, otpId, code), 'hex');
  const stored = Buffer.from(state.codeHash, 'hex');
  if (stored.length !== received.length || !timingSafeEqual(stored, received)) {
    state.failureWindowStartedAt ??= new Date(now);
    state.failedAttempts += 1;
    if (state.failedAttempts >= MAX_ATTEMPTS) {
      state.lockedUntil = new Date(now + FAILURE_WINDOW_MS);
      state.codeHash = null;
      state.expiresAt = null;
      return blocked(state.lockedUntil, now);
    }
    return invalid;
  }
  // Consumption happens before the surrounding transaction commits.
  state.codeHash = null;
  state.expiresAt = null;
  state.failedAttempts = 0;
  state.failureWindowStartedAt = null;
  state.lockedUntil = null;
  return { ok: true };
}
