import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('public_users')
export class PublicUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ type: 'varchar', unique: true, length: 255, nullable: true })
  googleSubject: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  passwordHash: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
