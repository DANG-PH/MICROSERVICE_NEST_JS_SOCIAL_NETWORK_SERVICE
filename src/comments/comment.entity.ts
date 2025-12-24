import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('comments') 
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false })
  postId: number;

  @Column({ nullable: false })
  parentId: number;

  @Column({ nullable: false })
  userId: number;

  @Column({ nullable: false, default: 0 })
  likeCount: number;   // Thêm để tránh query nặng COUNT(*) theo commentId bên entity kia

  @Column({ default: false })
  isDelete: boolean;   // Soft Delete

  @Column({ nullable: false })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
