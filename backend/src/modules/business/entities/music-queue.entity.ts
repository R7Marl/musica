import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessEntity } from './business.entity';

@Entity('music_queues')
export class MusicQueueEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  businessId: string;

  @ManyToOne(() => BusinessEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business: BusinessEntity;

  @Column({ length: 160 })
  name: string;

  @Column({ unique: true, length: 220 })
  slug: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
