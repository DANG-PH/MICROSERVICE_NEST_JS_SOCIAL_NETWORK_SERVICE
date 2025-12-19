import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {   
  SaveMessageRequest,
  SaveMessageResponse,
  GetMessageRequest,
  GetMessageResponse
} from 'proto/social-network.pb';
import { AuthService } from 'src/auth/auth.service';
import { ChatEntity } from './chat.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly repo: Repository<ChatEntity>,
  ) {}

  async saveMessage(req: SaveMessageRequest): Promise<SaveMessageResponse> {
    const msg = req.message;

    if (!msg || !msg.roomId || !msg.userId || !msg.content) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Thiếu thông tin message',
      });
    }

    const entity = this.repo.create({
        roomId: msg.roomId,
        userId: msg.userId,
        friendId: msg.friendId,
        content: msg.content,
        createdAt: new Date(),
    });

    await this.repo.save(entity);

    return { success: true };
  }

  async getMessage(req: GetMessageRequest): Promise<GetMessageResponse> {
    const { userId, roomId } = req;

    if (!userId || !roomId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Thiếu userId hoặc roomId',
      });
    }

    // Lấy tất cả message trong room
    const messages = await this.repo.find({
        where: { roomId },
        order: { createdAt: 'ASC' }, // sắp xếp theo thời gian
    });

    // Chỉ trả message liên quan đến user (userId hoặc friendId)
    const filtered = messages.filter(
        m => m.userId === userId || m.friendId === userId,
    );

    const protoMessages = filtered.map(m => ({
        roomId: m.roomId,
        userId: m.userId,
        friendId: m.friendId,
        content: m.content,
        create_at: m.createdAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
    }));

    return { message: protoMessages };
  }
}
