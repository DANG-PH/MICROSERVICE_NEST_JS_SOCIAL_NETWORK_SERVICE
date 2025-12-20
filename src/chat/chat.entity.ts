import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('chat') 
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  roomId: string;

  @Column({ nullable: false })
  userId: number;

  @Column({ type: 'longtext', nullable: false })
  content: string; 

  @CreateDateColumn()
  createdAt: Date;
}
