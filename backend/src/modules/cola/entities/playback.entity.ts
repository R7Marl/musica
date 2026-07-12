import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MusicQueueEntity } from '../../business/entities/music-queue.entity';
import type { PlaybackStatus } from '../types/cola.types';
import { QueueSongEntity } from './queue-song.entity';

@Entity('playback')
export class PlaybackEntity {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @ManyToOne(() => MusicQueueEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id' })
  queue: MusicQueueEntity;

  @Column({ length: 32, default: 'stopped' })
  status: PlaybackStatus;

  @Column({ type: 'uuid', nullable: true })
  currentSongId: string | null;

  @ManyToOne(() => QueueSongEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'currentSongId' })
  currentSong?: QueueSongEntity | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt: Date;
}
