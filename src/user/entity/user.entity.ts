import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
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
  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({ name: 'is_profile_exists', type: 'boolean', default: false })
  isProfileExists!: boolean;

  @Column({ name: 'full_name', type: 'varchar', length: 100, nullable: true })
  fullName!: string | null;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth!: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender!: Gender | null;

  @Column({ name: 'blood_group', type: 'enum', enum: BloodGroup, nullable: true })
  bloodGroup!: BloodGroup | null;

  @Column({ name: 'emergency_contact', type: 'varchar', length: 16, nullable: true })
  emergencyContact!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address!: string | null;

  @Column({ name: 'profile_photo_url', type: 'varchar', length: 100, nullable: true })
  profilePhotoUrl!: string | null;

  // Kept out of ordinary SELECT queries and all JSON responses.
  @Column({ name: 'profile_photo', type: 'mediumblob', nullable: true, select: false })
  profilePhoto!: Buffer | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 3 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 3 })
  updatedAt!: Date;
}
