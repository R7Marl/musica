import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { PublicUserEntity } from '../modules/auth/entities/public-user.entity';
import { UserEntity } from '../modules/auth/entities/user.entity';
import { BusinessEntity } from '../modules/business/entities/business.entity';
import { MusicQueueEntity } from '../modules/business/entities/music-queue.entity';
import { PlaybackEntity } from '../modules/cola/entities/playback.entity';
import { QueueSkipVoteEntity } from '../modules/cola/entities/queue-skip-vote.entity';
import { QueueSongEntity } from '../modules/cola/entities/queue-song.entity';
import { SongRequestEntity } from '../modules/cola/entities/song-request.entity';
import { InitialSchema1718660000000 } from './migrations/1718660000000-InitialSchema';
import { MultiTenantSchema1718661000000 } from './migrations/1718661000000-MultiTenantSchema';
import { PublicUsersAndSongRequests1718662000000 } from './migrations/1718662000000-PublicUsersAndSongRequests';
import { QueueSkipVotes1718663000000 } from './migrations/1718663000000-QueueSkipVotes';
import { PublicUserPasswords1718664000000 } from './migrations/1718664000000-PublicUserPasswords';
import { SongRequestHistory1718665000000 } from './migrations/1718665000000-SongRequestHistory';
import { ContentReviews1718666000000 } from './migrations/1718666000000-ContentReviews';
import { ContentReviewPolicy1718667000000 } from './migrations/1718667000000-ContentReviewPolicy';

config({
  path: `.env.${process.env.NODE_ENV ?? 'development'}`,
});
config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'cola_gym',
  password: process.env.DB_PASSWORD ?? 'cola_gym',
  database: process.env.DB_DATABASE ?? 'cola_gym',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: [
    UserEntity,
    PublicUserEntity,
    BusinessEntity,
    MusicQueueEntity,
    PlaybackEntity,
    QueueSongEntity,
    QueueSkipVoteEntity,
    SongRequestEntity,
  ],
  migrations: [
    InitialSchema1718660000000,
    MultiTenantSchema1718661000000,
    PublicUsersAndSongRequests1718662000000,
    QueueSkipVotes1718663000000,
    PublicUserPasswords1718664000000,
    SongRequestHistory1718665000000,
    ContentReviews1718666000000,
    ContentReviewPolicy1718667000000,
  ],
});
