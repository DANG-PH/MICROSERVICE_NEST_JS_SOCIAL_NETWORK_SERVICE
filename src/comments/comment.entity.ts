import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('comments') 
export class CommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // GetAllComment query WHERE postId = ? để load toàn bộ comment của bài viết
  @Index()
  @Column({ nullable: false })
  postId: number;

  // parentId không cần index riêng - đã load hết theo postId rồi build cây ở application layer
  @Column({ nullable: false })
  parentId: number;

  @Column({ nullable: false })
  userId: number; // không query độc lập

  @Column({ nullable: false, default: 0 })
  likeCount: number;   // Thêm để tránh query nặng COUNT(*) theo commentId bên entity kia

  @Column({ default: false })
  isDelete: boolean;   // Soft Delete

  @Column({ nullable: false })
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
