import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PublicUserEntity } from '../../auth/entities/public-user.entity';
import { MusicQueueEntity } from '../../business/entities/music-queue.entity';
import { QueueSongEntity } from './queue-song.entity';

@Entity('song_requests')
export class SongRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  queueId: string;

  @ManyToOne(() => MusicQueueEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queueId' })
  queue: MusicQueueEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => PublicUserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: PublicUserEntity;

  @Column({ type: 'uuid', nullable: true })
  queueSongId: string | null;

  @ManyToOne(() => QueueSongEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'queueSongId' })
  queueSong: QueueSongEntity | null;

  @Column('text')
  youtubeUrl: string;

  @Column({ length: 64 })
  youtubeVideoId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  requestedAt: Date;
}
