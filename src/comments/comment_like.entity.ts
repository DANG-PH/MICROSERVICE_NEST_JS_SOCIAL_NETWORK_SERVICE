import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm';

@Entity('comment_likes')
@Unique(['userId', 'commentId'])
export class CommentLikeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  commentId: number;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}