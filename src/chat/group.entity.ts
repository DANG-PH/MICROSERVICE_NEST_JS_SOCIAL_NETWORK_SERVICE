import { Index, Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatGroupMemberEntity } from './group_member.entity';

@Entity('chat_groups')
export class ChatGroupEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true, default: '' })
  description: string;

  @Index()
  @Column()
  ownerId: number;

  @Column({ default: 500 })
  maxMember: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatGroupMemberEntity, m => m.group, { cascade: true })
  members: ChatGroupMemberEntity[];
}

