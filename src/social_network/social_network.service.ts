import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialNetworkEntity } from './social_network.entity';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {   
  AddFriendRequest,
  AddFriendResponse,
  GetSentFriendRequest,
  GetSentFriendResponse,
  GetIncomingFriendRequest,
  GetIncomingFriendResponse,
  AcceptFriendRequest,
  AcceptFriendResponse,
  RejectFriendRequest,
  RejectFriendResponse,
  GetAllFriendRequest,
  GetAllFriendResponse,
  UnfriendRequest,
  UnfriendResponse,
  BlockUserRequest,
  BlockUserResponse,
  CanChatRequest,
  CanChatResponse
} from 'proto/social-network.pb';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SocialNetworkService {
  constructor(
    @InjectRepository(SocialNetworkEntity)
    private readonly repo: Repository<SocialNetworkEntity>,
    private readonly authService: AuthService
  ) {}

  async existsById(userId: number, friendId: number): Promise<boolean> {
    const existed = await this.repo.findOne({
      where: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    });

    return existed ? true : false;
  }

  /* ================= ADD FRIEND ================= */
  async addFriend(req: AddFriendRequest): Promise<AddFriendResponse> {
    const { userId, friendId } = req;

    if (userId === friendId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Không thể gửi kết bạn cho bản thân',
      });
    }

    const existed = await this.existsById(userId, friendId)
    if (existed) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Đã tồn tại quan hệ hoặc đã gửi lời mời kết bạn',
      });
    }

    const relation = await this.repo.save({
      userId,
      friendId,
      status: 0, // PENDING
    });

    return {
      relationId: relation.id,
      userId: relation.userId,
      friendId: relation.friendId,
      status: relation.status,
      create_at: relation.createdAt.toISOString(),
    };
  }

  /* ================= SENT FRIEND REQUEST ================= */
  async getSendFriend(req: GetSentFriendRequest): Promise<GetSentFriendResponse> {
    // Lấy tất cả request đang pending mà user gửi
    const rows = await this.repo.find({
      where: { userId: req.userId, status: 0 }, // PENDING
      order: { createdAt: 'DESC' },
    });

    // Lấy danh sách friendId
    const friendIds = rows.map(r => r.friendId);

    // Gọi authService
    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
      userIds: friendIds,
    });

    const avatarMap: Record<number, { realname: string; avatarUrl: string }> = {};
    for (const info of realnameAvatarResponse.realnameAvatarInfo) {
      avatarMap[info.userId] = { realname: info.realname, avatarUrl: info.avatarUrl };
    }

    const relationFriendInfo = rows.map(r => {
      const avatarInfo = avatarMap[r.friendId] || { realname: '', avatarUrl: '' };
      return {
        relationId: r.id,
        friendId: r.friendId,
        friendRealname: avatarInfo.realname,
        avatarUrl: avatarInfo.avatarUrl,
        status: r.status,
        create_at: r.createdAt.toISOString(),
      };
    });

    return { relationFriendInfo };
  }

  /* ================= INCOMING FRIEND REQUEST ================= */
  async getIncomingFriend(req: GetIncomingFriendRequest): Promise<GetIncomingFriendResponse> {
    // Lấy tất cả request đang pending mà user nhận
    const rows = await this.repo.find({
      where: { friendId: req.userId, status: 0 }, // PENDING
      order: { createdAt: 'DESC' },
    });

    // Lấy danh sách userId của người gửi request
    const userIds = rows.map(r => r.userId);

    // Gọi authService
    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
      userIds,
    });

    const avatarMap: Record<number, { realname: string; avatarUrl: string }> = {};
    for (const info of realnameAvatarResponse.realnameAvatarInfo) {
      avatarMap[info.userId] = { realname: info.realname, avatarUrl: info.avatarUrl };
    }

    const relationFriendInfo = rows.map(r => {
      const avatarInfo = avatarMap[r.userId] || { realname: '', avatarUrl: '' };
      return {
        relationId: r.id,
        friendId: r.userId,
        friendRealname: avatarInfo.realname,
        avatarUrl: avatarInfo.avatarUrl,
        status: r.status,
        create_at: r.createdAt.toISOString(),
      };
    });

    return { relationFriendInfo };
  }

  /* ================= ACCEPT FRIEND ================= */
  async acceptFriend(
    req: AcceptFriendRequest,
  ): Promise<AcceptFriendResponse> {
    const relation = await this.repo.findOne({
      where: { id: req.relationId, status: 0 },
    });

    if (!relation) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Không thấy thông tin của quan hệ này',
      });
    }

    if (relation.friendId !== req.userId) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bạn không có quyền chấp nhận yêu cầu kết bạn',
      });
    }

    relation.status = 1; // ACCEPTED
    await this.repo.save(relation);

    return {
      relationFriendInfo: {
        relationId: relation.id,
        friendId: relation.userId,
        friendRealname: 'Vui lòng xem thông tin bạn bè',
        avatarUrl: 'Vui lòng xem thông tin bạn bè',
        status: relation.status,
        create_at: relation.createdAt.toISOString(),
      },
    };
  }

  /* ================= REJECT FRIEND ================= */
  async rejectFriend(
    req: RejectFriendRequest,
  ): Promise<RejectFriendResponse> {
    const relation = await this.repo.findOne({
      where: { id: req.relationId, status: 0 },
    });

    if (!relation) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Pending request not found',
      });
    }

    if (relation.friendId !== req.userId && relation.userId !== req.userId) {
      throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Bạn không có quyền hủy yêu cầu kết bạn',
      });
    }

    await this.repo.delete(relation.id);
    return { success: true };
  }

  /* ================= GET ALL FRIEND ================= */
  async getAllFriend(req: GetAllFriendRequest,): Promise<GetAllFriendResponse> {
    const relations = await this.repo.find({
      where: [
        { userId: req.userId, status: 1 },
        { friendId: req.userId, status: 1 },
      ],
    });

    const friendIds = relations.map(r => (r.userId === req.userId ? r.friendId : r.userId));

    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
      userIds: friendIds,
    });

    const avatarMap: Record<number, { realname: string; avatarUrl: string }> = {};
    for (const info of realnameAvatarResponse.realnameAvatarInfo) {
      avatarMap[info.userId] = { realname: info.realname, avatarUrl: info.avatarUrl };
    }

    const friendInfo = relations.map(r => {
      const friendId = r.userId === req.userId ? r.friendId : r.userId;
      const avatarInfo = avatarMap[friendId] || { realname: '', avatarUrl: '' };

      return {
        friendId,
        friendRealname: avatarInfo.realname,
        avatarUrl: avatarInfo.avatarUrl,
        status: r.status,
      };
    });

    return { friendInfo: friendInfo };
  }

  /* ================= UNFRIEND ================= */
  async unfriend(req: UnfriendRequest): Promise<UnfriendResponse> {
    const relation = await this.repo.findOne({
      where: [
        { userId: req.userId, friendId: req.friendId, status: 1 },
        { userId: req.friendId, friendId: req.userId, status: 1 },
      ],
    });

    if (!relation) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Không tìm thấy quan hệ bạn bè',
      });
    }

    await this.repo.delete(relation.id);
    return { success: true };
  }

  /* ================= BLOCK USER ================= */
  async blockUser(req: BlockUserRequest): Promise<BlockUserResponse> {
    if (req.userId === req.friendId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Không thể block bản thân',
      });
    }

    let relation = await this.repo.findOne({
      where: [
        { userId: req.userId, friendId: req.friendId },
        { userId: req.friendId, friendId: req.userId },
      ],
    });

    if (!relation) {
      relation = this.repo.create({
        userId: req.userId,
        friendId: req.friendId,
        status: 2, // BLOCKED
      });
    } else {
      relation.status = 2;
      relation.userId = req.userId; // đảm bảo hướng block
      relation.friendId = req.friendId;
    }

    await this.repo.save(relation);
    return { success: true };
  }

  async canChat(req: CanChatRequest): Promise<CanChatResponse> {
    if (req.userId === req.friendId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Không thể chat với bản thân',
      });
    }

    const relation = await this.repo.findOne({
      where: [
        { userId: req.userId, friendId: req.friendId, status: 1 },
        { userId: req.friendId, friendId: req.userId, status: 1 },
      ],
    });

    if (!relation) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Không tìm thấy quan hệ bạn bè',
      });
    }

    if (relation.status === 2) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Quan hệ này đã bị block',
      });
    }

    return { canChat: true };
  }
}
