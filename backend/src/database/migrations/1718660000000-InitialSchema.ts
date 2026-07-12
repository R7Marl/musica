import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1718660000000 implements MigrationInterface {
  name = 'InitialSchema1718660000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "admin_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_admin_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_admin_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "queue_songs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "youtubeUrl" text NOT NULL,
        "youtubeVideoId" character varying(64) NOT NULL,
        "votes" integer NOT NULL DEFAULT 1,
        "manualPriority" integer NOT NULL DEFAULT 0,
        "status" character varying(32) NOT NULL DEFAULT 'queued',
        "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "lastPlayedAt" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_queue_songs" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_queue_songs_active_video"
      ON "queue_songs" ("youtubeVideoId", "status")
    `);

    await queryRunner.query(`
      CREATE TABLE "playback" (
        "id" character varying(32) NOT NULL,
        "status" character varying(32) NOT NULL DEFAULT 'stopped',
        "currentSongId" uuid,
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_playback" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "playback"
      ADD CONSTRAINT "FK_playback_current_song"
      FOREIGN KEY ("currentSongId") REFERENCES "queue_songs"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      INSERT INTO "playback" ("id", "status", "currentSongId")
      VALUES ('main', 'stopped', NULL)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playback" DROP CONSTRAINT "FK_playback_current_song"`,
    );
    await queryRunner.query(`DROP TABLE "playback"`);
    await queryRunner.query(`DROP INDEX "IDX_queue_songs_active_video"`);
    await queryRunner.query(`DROP TABLE "queue_songs"`);
    await queryRunner.query(`DROP TABLE "admin_users"`);
  }
}
