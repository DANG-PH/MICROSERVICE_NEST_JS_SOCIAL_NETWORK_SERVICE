import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {   
  CreateCommentRequest,
  CreateCommentResponse,
  GetAllCommentRequest,
  GetAllCommentResponse,
  UpdateCommentRequest,
  UpdateCommentResponse,
  DeleteCommentRequest,
  DeleteCommentResponse,
  LikeCommentRequest,
  LikeCommentResponse,
  UnlikeCommentRequest,
  UnlikeCommentResponse,
  CommentNode,
  GetCommentRequest,
  GetCommentResponse
} from 'proto/social-network.pb';
import { AuthService } from 'src/auth/auth.service';
import { CommentEntity } from './comment.entity';
import { CommentLikeEntity } from './comment_like.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(CommentEntity)
    private readonly repoComment: Repository<CommentEntity>,

    @InjectRepository(CommentLikeEntity)
    private readonly repoCommentLike: Repository<CommentLikeEntity>,

    private readonly authService: AuthService
  ) {}

  async createComment(req: CreateCommentRequest): Promise<CreateCommentResponse> {
    const { postId, parentId, userId, content } = req;

    if (!postId || !userId || !content) {
        throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Missing data'
        });
    }

    // Nếu ptrien thêm cần check bên admin service xem có postId đó k

    if (parentId && parentId !== 0) {
        const parent = await this.repoComment.findOne({
            where: { id: parentId },
        });

        if (!parent) {
        throw new RpcException({
            code: status.NOT_FOUND,
            message: 'Parent comment not found',
        });
        }

        // Kiểm tra parent phải cùng post
        if (parent.postId !== postId) {
            throw new RpcException({
                code: status.INVALID_ARGUMENT,
                message: 'Parent comment does not belong to this post',
            });
        }

        if (parent.isDelete) {
            throw new RpcException({
                code: status.FAILED_PRECONDITION,
                message: 'Cannot reply to deleted comment',
            });
        }
    }

    const comment = this.repoComment.create({
        postId,
        parentId: parentId || 0,
        userId,
        content
    });

    const saved = await this.repoComment.save(comment);

    // Get avatar + realname
    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
        userIds: [userId]
    });

    const info = realnameAvatarResponse.realnameAvatarInfo[0];

    return {
        comment: {
        id: saved.id,
        postId: saved.postId,
        parentId: saved.parentId,
        userId: saved.userId,
        content: saved.content,
        createdAt: saved.createdAt.toISOString(),
        likeCount: saved.likeCount,
        isLikedByCurrentUser: false,
        isDelete: saved.isDelete,
        realname: info?.realname || '',
        avatarUrl: info?.avatarUrl || '',
        children: []
        }
    };
  }

  async getAllComment(req: GetAllCommentRequest): Promise<GetAllCommentResponse> {
    const { postId, userId } = req;

    if (!postId || !userId) {
        throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Missing postId or userId'
        });
    }

    const comments = await this.repoComment.find({
        where: { postId },
        order: { createdAt: 'ASC' }
    });

    if (!comments.length) return { comments: [] };

    const commentIds = comments.map(c => c.id);

    // lấy list comment user đã like
    const liked = await this.repoCommentLike.find({
        where: { userId, commentId: In(commentIds) }
    });

    const likedSet = new Set(liked.map(l => l.commentId));

    // Lấy avatar + tên
    const userIds = [...new Set(comments.map(c => c.userId))];
    const realnameAvatarResponse = await this.authService.handleGetRealnameAvatar({
        userIds
    });

    const avatarMap: Record<number, { realname: string; avatarUrl: string }> = {};
    for (const info of realnameAvatarResponse.realnameAvatarInfo) {
        avatarMap[info.userId] = { realname: info.realname, avatarUrl: info.avatarUrl };
    }

    // Convert sang CommentNode
    const map: Record<number, CommentNode> = {};
    const roots: CommentNode[] = [];

    for (const c of comments) {
        map[c.id] = {
            id: c.id,
            postId: c.postId,
            parentId: c.parentId,
            userId: c.userId,
            content: c.isDelete ? 'Comment này đã bị xóa' : c.content,
            createdAt: c.createdAt.toISOString(),
            likeCount: c.likeCount,
            isLikedByCurrentUser: likedSet.has(c.id),
            isDelete: c.isDelete,
            realname: avatarMap[c.userId]?.realname || '',
            avatarUrl: avatarMap[c.userId]?.avatarUrl || '',
            children: []
        };
    }

    // Build cây
    for (const node of Object.values(map)) {
        if (node.parentId === 0) {
            roots.push(node);
        } else if (map[node.parentId]) {
            map[node.parentId].children.push(node);
        }
    }

    return { comments: roots };
  }

  async getComment(req: GetCommentRequest): Promise<GetCommentResponse> {
    const { commentId } = req;

    const c = await this.repoComment.findOne({
        where: { id: commentId },
    });

    if (!c) throw new RpcException({
                    code: status.INVALID_ARGUMENT,
                    message: 'Comment not found',
                  });
    
    const response = {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        userId: c.userId,
        content: c.isDelete ? 'Comment này đã bị xóa' : c.content,
        createdAt: c.createdAt.toISOString(),
        likeCount: c.likeCount,
        isLikedByCurrentUser: false,
        isDelete: c.isDelete,
        realname: '',
        avatarUrl: '',
        children: []
    }

    return { comment: response };
  }

  async updateComment(req: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    const { commentId, userId, content } = req;

    const comment = await this.repoComment.findOne({ where: { id: commentId } });
    if (!comment) {
        throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Comment not found'
        });
    }

    if (comment.userId !== userId) {
        throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Not allowed'
        });
    }

    if (comment.isDelete) {
        throw new RpcException({
        code: status.FAILED_PRECONDITION,
        message: 'Comment deleted'
        });
    }

    comment.content = content;
    await this.repoComment.save(comment);

    return { success: true };
  }

  async deleteComment(req: DeleteCommentRequest): Promise<DeleteCommentResponse> {
    const { commentId, userId } = req;

    const comment = await this.repoComment.findOne({ where: { id: commentId } });
    if (!comment) {
        throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Comment not found'
        });
    }

    if (comment.userId !== userId) {
        throw new RpcException({
        code: status.PERMISSION_DENIED,
        message: 'Not allowed'
        });
    }

    comment.isDelete = true;
    await this.repoComment.save(comment);

    return { success: true };
  }

  async likeComment(req: LikeCommentRequest): Promise<LikeCommentResponse> {
    const { commentId, userId } = req;

    const comment = await this.repoComment.findOne({ where: { id: commentId } });
    if (!comment) {
        throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Comment not found'
        });
    }

    try {
        const like = this.repoCommentLike.create({ commentId, userId });
        await this.repoCommentLike.save(like);

        await this.repoComment.increment({ id: commentId }, 'likeCount', 1);

    } catch (err) {
        // Trường hợp đã like rồi (unique constraint)
    }

    return { success: true };
  }

  async unlikeComment(req: UnlikeCommentRequest): Promise<UnlikeCommentResponse> {
    const { commentId, userId } = req;

    await this.repoCommentLike.delete({ commentId, userId });

    await this.repoComment.decrement({ id: commentId }, 'likeCount', 1);

    return { success: true };
  }
}
