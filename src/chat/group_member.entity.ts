import { Index, Unique, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,JoinColumn, UpdateDateColumn, OneToMany, ManyToOne } from 'typeorm';
import { ChatGroupEntity } from './group.entity';

@Entity('chat_group_members')
@Unique(['groupId', 'userId'])
export class ChatGroupMemberEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  groupId: number;

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
