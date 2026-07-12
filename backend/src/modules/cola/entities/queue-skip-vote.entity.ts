import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { PublicUserEntity } from '../../auth/entities/public-user.entity';
import { QueueSongEntity } from './queue-song.entity';

@Entity('queue_skip_votes')
@Unique(['songId', 'userId'])
export class QueueSkipVoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  songId: string;

  @ManyToOne(() => QueueSongEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'songId' })
  song: QueueSongEntity;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => PublicUserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: PublicUserEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
