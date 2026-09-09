import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Userlogin1788781647835 implements MigrationInterface {
  name = 'Userlogin1788781647835';

  async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    const hasOtps = await queryRunner.hasTable('email_otps');
    const upgradingPreviousProject = await this.previousMigrationApplied(queryRunner);

    if (upgradingPreviousProject) {
      if (!hasUsers || !hasOtps) {
        throw new Error('The previous migration is recorded, but its tables are missing.');
      }
      if (await queryRunner.hasColumn('email_otps', 'otpid')) return;
      // The old column name appears only in this compatibility migration.
      if (!(await queryRunner.hasColumn('email_otps', 'challenge_id'))) {
        throw new Error('The previous OTP column is missing; inspect the database schema.');
      }
      await queryRunner.renameColumn('email_otps', 'challenge_id', 'otpid');
      return;
    }

    if (hasUsers || hasOtps) {
      throw new Error(
        'Existing user tables have no recognized migration history. Use a fresh database or review its migration history.',
      );
    }

    await queryRunner.query(`CREATE TABLE users (
      id varchar(36) NOT NULL,
      email varchar(254) NOT NULL,
      is_email_verified tinyint NOT NULL DEFAULT 0,
      is_profile_exists tinyint NOT NULL DEFAULT 0,
      full_name varchar(100) NULL,
      date_of_birth date NULL,
      gender enum('male','female','other','prefer_not_to_say') NULL,
      blood_group enum('A+','A-','B+','B-','AB+','AB-','O+','O-','unknown') NULL,
      emergency_contact varchar(16) NULL,
      address varchar(500) NULL,
      profile_photo_url varchar(100) NULL,
      profile_photo mediumblob NULL,
      created_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY UQ_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

    await queryRunner.query(`CREATE TABLE email_otps (
      user_id varchar(36) NOT NULL,
      otpid varchar(36) NULL,
      code_hash varchar(64) NULL,
      expires_at datetime(3) NULL,
      last_sent_at datetime(3) NULL,
      send_window_started_at datetime(3) NULL,
      send_count int unsigned NOT NULL DEFAULT 0,
      failure_window_started_at datetime(3) NULL,
      failed_attempts int unsigned NOT NULL DEFAULT 0,
      locked_until datetime(3) NULL,
      PRIMARY KEY (user_id),
      CONSTRAINT FK_email_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    if (await this.previousMigrationApplied(queryRunner)) {
      // Restore compatibility with the previous app while preserving its data.
      await queryRunner.renameColumn('email_otps', 'otpid', 'challenge_id');
      return;
    }
    // Reverting a fresh installation removes the tables and their data.
    await queryRunner.query('DROP TABLE email_otps');
    await queryRunner.query('DROP TABLE users');
  }

  private async previousMigrationApplied(queryRunner: QueryRunner): Promise<boolean> {
    if (!(await queryRunner.hasTable('migrations'))) return false;
    const rows: unknown = await queryRunner.query('SELECT name FROM migrations WHERE name = ?', [
      'InitialEmailAuth1788739200000',
    ]);
    return Array.isArray(rows) && rows.length > 0;
  }
}