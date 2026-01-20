import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification') 
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
