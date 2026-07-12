import { MigrationInterface, QueryRunner } from 'typeorm';

export class MultiTenantSchema1718661000000 implements MigrationInterface {
  name = 'MultiTenantSchema1718661000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "businesses" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(160) NOT NULL,
        "slug" character varying(180) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_businesses_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_businesses" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role" character varying(32) NOT NULL,
        "businessId" uuid,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "music_queues" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "name" character varying(160) NOT NULL,
        "slug" character varying(220) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_music_queues_slug" UNIQUE ("slug"),
        CONSTRAINT "PK_music_queues" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD CONSTRAINT "FK_users_business"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "music_queues"
      ADD CONSTRAINT "FK_music_queues_business"
      FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`DELETE FROM "playback"`);
    await queryRunner.query(`DELETE FROM "queue_songs"`);

    await queryRunner.query(`
      ALTER TABLE "queue_songs"
      ADD "queueId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "queue_songs"
      ALTER COLUMN "queueId" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "queue_songs"
      ADD CONSTRAINT "FK_queue_songs_queue"
      FOREIGN KEY ("queueId") REFERENCES "music_queues"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "playback"
      DROP CONSTRAINT "FK_playback_current_song"
    `);

    await queryRunner.query(`
      ALTER TABLE "playback"
      ALTER COLUMN "id" TYPE uuid USING NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "playback"
      ADD CONSTRAINT "FK_playback_queue"
      FOREIGN KEY ("id") REFERENCES "music_queues"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "playback"
      ADD CONSTRAINT "FK_playback_current_song"
      FOREIGN KEY ("currentSongId") REFERENCES "queue_songs"("id")
      ON DELETE SET NULL
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "playback" DROP CONSTRAINT "FK_playback_current_song"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playback" DROP CONSTRAINT "FK_playback_queue"`,
    );
    await queryRunner.query(
      `ALTER TABLE "playback" ALTER COLUMN "id" TYPE character varying(32) USING 'main'`,
    );
    await queryRunner.query(`
      ALTER TABLE "playback"
      ADD CONSTRAINT "FK_playback_current_song"
      FOREIGN KEY ("currentSongId") REFERENCES "queue_songs"("id")
      ON DELETE SET NULL
    `);
    await queryRunner.query(
      `ALTER TABLE "queue_songs" DROP CONSTRAINT "FK_queue_songs_queue"`,
    );
    await queryRunner.query(`ALTER TABLE "queue_songs" DROP COLUMN "queueId"`);
    await queryRunner.query(
      `ALTER TABLE "music_queues" DROP CONSTRAINT "FK_music_queues_business"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_business"`,
    );
    await queryRunner.query(`DROP TABLE "music_queues"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "businesses"`);
  }
}
