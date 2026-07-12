import { MigrationInterface, QueryRunner } from 'typeorm';

export class ContentReviews1718666000000 implements MigrationInterface {
  name = 'ContentReviews1718666000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "content_reviews" (
        "youtubeVideoId" character varying(64) NOT NULL,
        "title" text NOT NULL,
        "channelTitle" text NOT NULL,
        "durationSeconds" integer NOT NULL,
        "categoryId" character varying(32) NOT NULL,
        "decision" character varying(16) NOT NULL,
        "rejectionReason" text,
        "analysis" jsonb,
        "reviewedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_content_reviews" PRIMARY KEY ("youtubeVideoId")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "content_reviews"`);
  }
}
