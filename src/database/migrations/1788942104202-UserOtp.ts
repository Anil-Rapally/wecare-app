import { Table, TableForeignKey, type MigrationInterface, type QueryRunner } from 'typeorm';

export class UserOtp1788942104202 implements MigrationInterface {
  name = 'UserOtp1788942104202';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'email_otps',
        columns: [
          {
            name: 'user_id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'otpid',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'code_hash',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'expires_at',
            type: 'datetime',
            precision: 3,
            isNullable: true,
          },
          {
            name: 'last_sent_at',
            type: 'datetime',
            precision: 3,
            isNullable: true,
          },
          {
            name: 'send_window_started_at',
            type: 'datetime',
            precision: 3,
            isNullable: true,
          },
          {
            name: 'send_count',
            type: 'int',
            unsigned: true,
            isNullable: false,
            default: '0',
          },
          {
            name: 'failure_window_started_at',
            type: 'datetime',
            precision: 3,
            isNullable: true,
          },
          {
            name: 'failed_attempts',
            type: 'int',
            unsigned: true,
            isNullable: false,
            default: '0',
          },
          {
            name: 'locked_until',
            type: 'datetime',
            precision: 3,
            isNullable: true,
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_email_otps_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          }),
        ],
      }),
      true, // ifNotExists: true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_otps');
  }
}
