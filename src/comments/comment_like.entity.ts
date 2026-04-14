import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique, Index } from 'typeorm';

// Leftprefix k có tác dụng trong case này nên để cái nào trước cũng được
// leftprefix quan trọng khi có case 1 trong 2 cái k dc query mà cái còn lại thì có
@Unique(['commentId', 'userId'])
@Entity('comment_likes')
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