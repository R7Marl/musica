import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { BusinessEntity } from '../../business/entities/business.entity';

export type UserRole = 'owner' | 'client';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  passwordHash: string;

  @Column({ length: 32 })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  businessId: string | null;

  @ManyToOne(() => BusinessEntity, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'businessId' })
  business?: BusinessEntity | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
