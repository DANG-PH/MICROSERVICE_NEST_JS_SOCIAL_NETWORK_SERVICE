import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {   
  SaveMessageRequest,
  SaveMessageResponse,
  GetMessageRequest,
  GetMessageResponse,
  CreateGroupRequest,
  CreateGroupResponse,
  AddUserToGroupRequest,
  AddUserToGroupResponse,
  CheckGroupUserRequest,
  CheckGroupUserResponse,
  GetAllGroupRequest,
  GetAllGroupResponse
} from 'proto/social-network.pb';
import { AuthService } from 'src/auth/auth.service';
import { ChatEntity } from './chat.entity';
import { ChatGroupEntity } from './group.entity';
import { ChatGroupMemberEntity } from './group_member.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatEntity)
    private readonly repo: Repository<ChatEntity>,

    @InjectRepository(ChatGroupEntity)
    private readonly repoGroupChat: Repository<ChatGroupEntity>,

    @InjectRepository(ChatGroupMemberEntity)
    private readonly repoGroupChatMember: Repository<ChatGroupMemberEntity>,

    private readonly authService: AuthService
  ) {}

  async saveMessage(req: SaveMessageRequest): Promise<SaveMessageResponse> {
    const msg = req.message;

    if (!msg || !msg.roomId || !msg.userId || !msg.content) {
      throw new RpcException({
        status: status.INVALID_ARGUMENT,
        message: 'Thiếu thông tin message',
      });
    }

    const entity = this.repo.create({
        roomId: msg.roomId,
        userId: msg.userId,
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
        status: status.INVALID_ARGUMENT,
        message: 'Thiếu userId hoặc roomId',
      });
    }

    // Lấy tất cả message trong room
    const messages = await this.repo.find({
        where: { roomId },
        order: { createdAt: 'ASC' }, // sắp xếp theo thời gian
    });

    let filtered;
    // Chỉ trả message liên quan đến user 
    if (roomId.startsWith('dm')) {
      const [, a, b] = roomId.split(':');
      const members = [Number(a), Number(b)];
      if (!members.includes(userId)) throw new RpcException({status: status.PERMISSION_DENIED, message: "Bạn có ý định nghe lén tin nhắn, vui lòng dừng lại!"});

      filtered = messages; 
    }
    else if (roomId.startsWith('group')) {
      const [, a] = roomId.split(':');
      const groupId = Number(a);
      const success = await this.checkGroupUser({
        groupId: groupId,
        userId: userId
      })
      if (!success) throw new RpcException({status: status.PERMISSION_DENIED, message: "Bạn có ý định nghe lén tin nhắn, vui lòng dừng lại!"});

      filtered = messages; 
    }
    else {
      if (!filtered) filtered = [];
    }

    // Lấy danh sách userId của Room
    const userIds = filtered.map(m => m.userId);

    // Gọi authService
    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
      userIds: userIds,
    });

    const avatarMap: Record<number, { realname: string; avatarUrl: string }> = {};
    for (const info of realnameAvatarResponse.realnameAvatarInfo) {
      avatarMap[info.userId] = { realname: info.realname, avatarUrl: info.avatarUrl };
    }

    const protoMessages = filtered.map(m => {
      const avatarInfo = avatarMap[m.userId] || { realname: '', avatarUrl: '' };

      return {
        roomId: m.roomId,
        userId: m.userId,
        avatarUrl: avatarInfo.avatarUrl,
        realname: avatarInfo.realname,
        content: m.content,
        create_at: m.createdAt.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      };
    });

    return { message: protoMessages };
  }

  async createGroup(req: CreateGroupRequest): Promise<CreateGroupResponse> {
    if (!req || !req.name || !req.avatarUrl || !req.ownerId || !req.maxMember ) {
      throw new RpcException({
        status: status.INVALID_ARGUMENT,
        message: 'Thiếu thông tin group',
      });
    }

    const entity = this.repoGroupChat.create({
        name: req.name,
        avatarUrl: req.avatarUrl,
        description: req.description,
        ownerId: req.ownerId,
        maxMember: req.maxMember,
        createdAt: new Date()
    });
     
    const group = await this.repoGroupChat.save(entity);

    await this.addUserToGroup({
      userId: req.ownerId,
      groupId: group.id,
      role: 0
    })

    await this.addUsersToGroup({
      userId: req.userId,
      groupId: group.id
    })

    return { success: true };
  }

  async addUserToGroup(req: AddUserToGroupRequest): Promise<AddUserToGroupResponse> {
    const { userId, groupId, role } = req; // Tạm thời k dùng role gửi vào ( sau này có thể dùng khi phân quyền )

    if (!userId || !groupId) {
      throw new RpcException({
        status: status.INVALID_ARGUMENT,
        message: 'Thiếu userId hoặc groupId',
      });
    }

    const group = await this.repoGroupChat.findOne({
      where: { id: groupId },
      relations: ['members'],
    });

    if (!group) {
      throw new RpcException({
        status: status.NOT_FOUND,
        message: 'Group không tồn tại',
      });
    }

    // Check max member
    const memberCount = await this.repoGroupChatMember.count({
      where: { groupId },
    });

    if (memberCount >= group.maxMember) {
      throw new RpcException({
        code: status.RESOURCE_EXHAUSTED,
        message: 'Nhóm đã đạt số lượng thành viên tối đa',
      });
    }

    // Check user đã tồn tại chưa
    const existed = await this.repoGroupChatMember.findOne({
      where: { groupId, userId },
    });

    if (existed) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'User đã ở trong nhóm',
      });
    }

    const entity = this.repoGroupChatMember.create({
      userId: userId,
      groupId: groupId,
      role: 1, // mac dinh member
    });

    await this.repoGroupChatMember.save(entity);

    return { success: true };
  }

  // hàm dùng cho khi tạo group
  async addUsersToGroup(
    req: { userId: number[]; groupId: number },
  ): Promise<AddUserToGroupResponse> {
    const { userId, groupId } = req;

    if (!Array.isArray(userId) || userId.length === 0 || !groupId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Thiếu hoặc sai định dạng userId / groupId',
      });
    }

    // 1. Check group tồn tại
    const group = await this.repoGroupChat.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Group không tồn tại',
      });
    }

    // 2. Đếm số member hiện tại
    const currentMemberCount = await this.repoGroupChatMember.count({
      where: { groupId },
    });

    if (currentMemberCount + userId.length > group.maxMember) {
      throw new RpcException({
        code: status.RESOURCE_EXHAUSTED,
        message: 'Nhóm đã đạt số lượng thành viên tối đa',
      });
    }

    // 3. Lấy danh sách user đã tồn tại trong group
    const existedMembers = await this.repoGroupChatMember.find({
      where: {
        groupId,
        userId: In(userId),
      },
      select: ['userId'],
    });

    const existedUserIds = new Set(existedMembers.map(m => m.userId));

    // 4. Lọc user chưa có trong group
    const newUserIds = userId.filter(id => !existedUserIds.has(id));

    if (newUserIds.length === 0) {
      throw new RpcException({
        code: status.ALREADY_EXISTS,
        message: 'Tất cả user đã ở trong nhóm',
      });
    }

    // 5. Check lại max member (sau khi loại trùng)
    if (currentMemberCount + newUserIds.length > group.maxMember) {
      throw new RpcException({
        code: status.RESOURCE_EXHAUSTED,
        message: 'Vượt quá số lượng thành viên cho phép',
      });
    }

    // 6. Bulk create
    const entities = newUserIds.map(uid =>
      this.repoGroupChatMember.create({
        userId: uid,
        groupId,
        role: 1, // member
      }),
    );

    await this.repoGroupChatMember.save(entities);

    return {
      success: true,
    };
  }

  async checkGroupUser(req: CheckGroupUserRequest): Promise<CheckGroupUserResponse> {
    const { userId, groupId } = req;

    if (!userId || !groupId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Thiếu userId hoặc groupId',
      });
    }

    const existed = await this.repoGroupChatMember.findOne({
      where: { groupId, userId },
    });

    return { success: existed ? true : false };
  }

  async getAllGroup(req: GetAllGroupRequest): Promise<GetAllGroupResponse> {
    const memberships = await this.repoGroupChatMember.find({
      where: { userId: req.userId },
      select: ['groupId'],
    });

    if (!memberships || memberships.length === 0) {
      return { groupInfo: [] };
    }

    const groupIds = memberships.map(m => m.groupId);

    // Lấy thông tin group
    const groups = await this.repoGroupChat.find({
      where: { id: In(groupIds) },
    });

    const result = groups.map(g => ({
      groupId: g.id,
      name: g.name,
      avatarUrl: g.avatarUrl,
      description: g.description ?? '',
      ownerId: g.ownerId,
    }));

    return { groupInfo: result };
  }
}
