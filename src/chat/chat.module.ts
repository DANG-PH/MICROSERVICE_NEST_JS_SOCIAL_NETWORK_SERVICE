import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { AuthModule } from 'src/auth/auth.module';
import { ChatService } from './chat.service';
import { ChatEntity } from './chat.entity';
import { ChatGroupMemberEntity } from './group_member.entity';
import { ChatGroupEntity } from './group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, ChatGroupMemberEntity, ChatGroupEntity]), AuthModule],
  providers: [ChatService],
  exports: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}