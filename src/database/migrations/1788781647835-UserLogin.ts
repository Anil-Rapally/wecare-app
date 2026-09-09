import { Table, TableUnique, type MigrationInterface, type QueryRunner } from 'typeorm';

export class UserLogin1788781647835 implements MigrationInterface {
  name = 'UserLogin1788781647835';

  async up(queryRunner: QueryRunner): Promise<void> {
    const hasUsers = await queryRunner.hasTable('users');
    if (hasUsers) {
      throw new Error(
        'Existing users table has no recognized migration history. Use a fresh database or review its migration history.',
      );
    }
    else {
      await queryRunner.createTable(
        new Table({
          name: 'users',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
              isNullable: false,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '254',
              isNullable: false,
            },
            {
              name: 'is_email_verified',
              type: 'tinyint',
              isNullable: false,
              default: '0',
            },
            {
              name: 'is_profile_exists',
              type: 'tinyint',
              isNullable: false,
              default: '0',
            },
            {
              name: 'full_name',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'date_of_birth',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'gender',
              type: 'enum',
              enum: ['male', 'female', 'other', 'prefer_not_to_say'],
              isNullable: true,
            },
            {
              name: 'blood_group',
              type: 'enum',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
              isNullable: true,
            },
            {
              name: 'emergency_contact',
              type: 'varchar',
              length: '16',
              isNullable: true,
            },
            {
              name: 'address',
              type: 'varchar',
              length: '500',
              isNullable: true,
            },
            {
              name: 'profile_photo_url',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'profile_photo',
              type: 'mediumblob',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'datetime',
              precision: 3,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(3)',
            },
            {
              name: 'updated_at',
              type: 'datetime',
              precision: 3,
              isNullable: false,
              default: 'CURRENT_TIMESTAMP(3)',
              onUpdate: 'CURRENT_TIMESTAMP(3)',
            },
          ],
          uniques: [
            new TableUnique({
              name: 'UQ_users_email',
              columnNames: ['email'],
            }),
          ],
        }),
        true, // ifNotExists: true
      );
    }
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
