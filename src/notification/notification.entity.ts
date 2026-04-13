import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notification') 
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // GetNotificationByUser query WHERE userId = ?
  @Index()
  @Column({ nullable: false })
  userId: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'longtext' })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
