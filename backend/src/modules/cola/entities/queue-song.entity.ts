import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MusicQueueEntity } from '../../business/entities/music-queue.entity';
import { PublicUserEntity } from '../../auth/entities/public-user.entity';

@Entity('queue_songs')
export class QueueSongEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  queueId: string;

  @ManyToOne(() => MusicQueueEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'queueId' })
  queue: MusicQueueEntity;

  @Column({ type: 'uuid' })
  requestedByUserId: string;

  @ManyToOne(() => PublicUserEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requestedByUserId' })
  requestedBy: PublicUserEntity;

  @Column('text')
  youtubeUrl: string;

  @Column({ length: 64 })
  youtubeVideoId: string;

  @Column({ default: 1 })
  votes: number;

  @Column({ default: 0 })
  manualPriority: number;

  @Column({ length: 32, default: 'queued' })
  status: 'queued' | 'playing' | 'played';

  @CreateDateColumn({ type: 'timestamptz' })
  requestedAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastPlayedAt?: Date | null;
}
