import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserOtp1788942104202 implements MigrationInterface {
  name = 'UserOtp1788942104202';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasOtps = await queryRunner.hasTable('email_otps');
    if (hasOtps) {
      throw new Error(
        'Existing email_otps table has no recognized migration history. Use a fresh database or review its migration history.',
      );
    }

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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS email_otps');
  }
}
