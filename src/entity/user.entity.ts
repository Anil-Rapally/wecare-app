import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown',
}

@Entity('users')
@Index('UQ_users_email', ['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 254 })
  email!: string;

  // A preliminary row can exist while signup is unfinished.
  @Column({ type: 'boolean', default: false })
  is_email_verified!: boolean;

  @Column({ type: 'boolean', default: false })
  is_profile_exists!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  full_name!: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth!: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender | null;

  @Column({ type: 'enum', enum: BloodGroup, nullable: true })
  blood_group!: BloodGroup | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  emergency_contact!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  profile_photo_url!: string | null;

  // Kept out of ordinary SELECT queries and all JSON responses.
  @Column({ type: 'mediumblob', nullable: true, select: false })
  profile_photo!: Buffer | null;

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updated_at!: Date;
}

@Entity('email_otps')
export class EmailOtp {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  user_id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_email_otps_user' })
  user!: User;

  @Column({ type: 'varchar', length: 36, nullable: true })
  otpid: string | null = null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  code_hash: string | null = null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  expires_at: Date | null = null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  last_sent_at: Date | null = null;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  send_window_started_at: Date | null = null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  send_count = 0;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  failure_window_started_at: Date | null = null;

  @Column({ type: 'int', unsigned: true, default: 0 })
  failed_attempts = 0;

  @Column({ type: 'datetime', precision: 3, nullable: true })
  locked_until: Date | null = null;
}