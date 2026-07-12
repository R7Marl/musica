import { MigrationInterface, QueryRunner } from 'typeorm';

export class SongRequestHistory1718665000000 implements MigrationInterface {
  name = 'SongRequestHistory1718665000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "song_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "queueId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "queueSongId" uuid,
        "youtubeUrl" text NOT NULL,
        "youtubeVideoId" character varying(64) NOT NULL,
        "requestedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_song_requests" PRIMARY KEY ("id"),
        CONSTRAINT "FK_song_requests_queue" FOREIGN KEY ("queueId")
          REFERENCES "music_queues"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_song_requests_user" FOREIGN KEY ("userId")
          REFERENCES "public_users"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_song_requests_song" FOREIGN KEY ("queueSongId")
          REFERENCES "queue_songs"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_song_requests_user_queue_requested"
      ON "song_requests" ("userId", "queueId", "requestedAt")
    `);
    await queryRunner.query(`
      INSERT INTO "song_requests" (
        "queueId", "userId", "queueSongId", "youtubeUrl", "youtubeVideoId", "requestedAt"
      )
      SELECT
        "queueId", "requestedByUserId", "id", "youtubeUrl", "youtubeVideoId", "requestedAt"
      FROM "queue_songs"
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "IDX_song_requests_user_queue_requested"`,
    );
    await queryRunner.query(`DROP TABLE "song_requests"`);
  }
}
