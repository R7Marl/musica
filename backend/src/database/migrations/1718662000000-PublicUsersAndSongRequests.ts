import { MigrationInterface, QueryRunner } from 'typeorm';

export class PublicUsersAndSongRequests1718662000000 implements MigrationInterface {
  name = 'PublicUsersAndSongRequests1718662000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "googleSubject" character varying(255) NOT NULL,
        "name" character varying(255) NOT NULL,
        "avatarUrl" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_public_users_email" UNIQUE ("email"),
        CONSTRAINT "UQ_public_users_google_subject" UNIQUE ("googleSubject"),
        CONSTRAINT "PK_public_users" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "name" character varying(255)
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ADD "avatarUrl" text
    `);

    await queryRunner.query(`DELETE FROM "queue_songs"`);

    await queryRunner.query(`
      ALTER TABLE "queue_songs"
      ADD "requestedByUserId" uuid NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "queue_songs"
      ADD CONSTRAINT "FK_queue_songs_requested_by"
      FOREIGN KEY ("requestedByUserId") REFERENCES "public_users"("id")
      ON DELETE RESTRICT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "queue_songs" DROP CONSTRAINT "FK_queue_songs_requested_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "queue_songs" DROP COLUMN "requestedByUserId"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatarUrl"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(`DROP TABLE "public_users"`);
  }
}
