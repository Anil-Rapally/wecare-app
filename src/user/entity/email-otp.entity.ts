import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('email_otps')
export class EmailOtp {
  @PrimaryColumn({ name: 'user_id', type: 'varchar', length: 36 })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_email_otps_user' })
  user!: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  otpid: string | null = null;

  @Column({ name: 'code_hash', type: 'varchar', length: 64, nullable: true })
  codeHash: string | null = null;

  @Column({ name: 'expires_at', type: 'datetime', precision: 3, nullable: true })
  expiresAt: Date | null = null;

  @Column({ name: 'last_sent_at', type: 'datetime', precision: 3, nullable: true })
  lastSentAt: Date | null = null;

  @Column({ name: 'send_window_started_at', type: 'datetime', precision: 3, nullable: true })
  sendWindowStartedAt: Date | null = null;

  @Column({ name: 'send_count', type: 'int', unsigned: true, default: 0 })
  sendCount = 0;

  @Column({ name: 'failure_window_started_at', type: 'datetime', precision: 3, nullable: true })
  failureWindowStartedAt: Date | null = null;

  @Column({ name: 'failed_attempts', type: 'int', unsigned: true, default: 0 })
  failedAttempts = 0;

  @Column({ name: 'locked_until', type: 'datetime', precision: 3, nullable: true })
  lockedUntil: Date | null = null;
}
