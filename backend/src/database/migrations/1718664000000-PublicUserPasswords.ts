import { MigrationInterface, QueryRunner } from 'typeorm';

export class PublicUserPasswords1718664000000 implements MigrationInterface {
  name = 'PublicUserPasswords1718664000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "public_users"
      ALTER COLUMN "googleSubject" DROP NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "public_users"
      ADD "passwordHash" character varying(255)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "public_users"
      WHERE "googleSubject" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "public_users"
      DROP COLUMN "passwordHash"
    `);
    await queryRunner.query(`
      ALTER TABLE "public_users"
      ALTER COLUMN "googleSubject" SET NOT NULL
    `);
  }
}
