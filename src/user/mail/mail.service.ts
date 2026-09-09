import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleDestroy {
  private readonly transporter: Transporter;

  constructor(private readonly config: ConfigService) {
    const secure = config.getOrThrow<string>('SMTP_SECURE') === 'true';
    this.transporter = nodemailer.createTransport({
      host: config.getOrThrow<string>('SMTP_HOST'),
      port: Number(config.getOrThrow<string>('SMTP_PORT')),
      secure,
      requireTLS: !secure,
      auth: {
        user: config.getOrThrow<string>('SMTP_USER'),
        pass: config.getOrThrow<string>('SMTP_PASSWORD'),
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    // Never log the code or put it in the HTTP response.
    const result = await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: email,
      subject: 'Your WeCare verification code',
      text: `Your WeCare verification code is ${otp}. It expires in 5 minutes. Do not share this code. If you did not request it, ignore this email.`,
    });
    if (!result.accepted?.length) throw new Error('SMTP recipient was not accepted');
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
