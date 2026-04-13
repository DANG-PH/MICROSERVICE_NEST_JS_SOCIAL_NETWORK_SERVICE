import { Index, Unique, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,JoinColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { ChatGroupEntity } from './group.entity';

@Entity('chat_group_members')
@Unique(['groupId', 'userId'])
export class ChatGroupMemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  // KHÔNG cần @Index() riêng vì Unique(['groupId','userId'])
  // đã cover query WHERE groupId = ? qua leftmost prefix
  @Column()
  groupId: number;

  // Cần index riêng vì GetAllGroup query WHERE userId = ?
  // Unique index (groupId, userId) không dùng được khi chỉ filter userId
  @Index()
  @Column()
  userId: number;

  @Column()
  role: number;

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => ChatGroupEntity, group => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: ChatGroupEntity;
}
