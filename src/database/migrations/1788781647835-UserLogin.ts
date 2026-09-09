import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UserLogin1788781647835 implements MigrationInterface {
  name = 'UserLogin1788781647835';

  async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    if (hasUsers) {
      throw new Error(
        'Existing users table has no recognized migration history. Use a fresh database or review its migration history.',
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
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
