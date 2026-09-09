export const OTP_TTL_SECONDS = 300;
export const OTP_SEND_BLOCK_SECONDS = 120;
export const OTP_MIN_DELAY_SECONDS = 15;
export const MAX_SENDS_PER_WINDOW = 3;
export const MAX_ATTEMPTS = 5;

export type OtpFailure = {
  ok: false;
  status: 401 | 429;
  code: 'INVALID_OR_EXPIRED_OTP' | 'TOO_MANY_ATTEMPTS' | 'RESEND_TOO_SOON' | 'EMAIL_SEND_LIMIT';
  message: string | string[];
  retryAfter?: number;
};
