import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentReviewPolicy1718667000000 implements MigrationInterface {
  name = 'ContentReviewPolicy1718667000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "content_reviews"`);
  }

  async down(): Promise<void> {}
}
