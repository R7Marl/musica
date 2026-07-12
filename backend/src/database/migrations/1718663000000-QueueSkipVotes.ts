import { MigrationInterface, QueryRunner } from 'typeorm';

export class QueueSkipVotes1718663000000 implements MigrationInterface {
  name = 'QueueSkipVotes1718663000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "queue_skip_votes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "songId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_queue_skip_votes_song_user" UNIQUE ("songId", "userId"),
        CONSTRAINT "PK_queue_skip_votes" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "queue_skip_votes"
      ADD CONSTRAINT "FK_queue_skip_votes_song"
      FOREIGN KEY ("songId") REFERENCES "queue_songs"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "queue_skip_votes"
      ADD CONSTRAINT "FK_queue_skip_votes_user"
      FOREIGN KEY ("userId") REFERENCES "public_users"("id")
      ON DELETE CASCADE
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "queue_skip_votes" DROP CONSTRAINT "FK_queue_skip_votes_user"`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_skip_votes" DROP CONSTRAINT "FK_queue_skip_votes_song"`,
    );
    await queryRunner.query(`DROP TABLE "queue_skip_votes"`);
  }
}
