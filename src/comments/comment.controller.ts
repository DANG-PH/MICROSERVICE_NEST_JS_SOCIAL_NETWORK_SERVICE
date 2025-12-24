import { Controller, InternalServerErrorException, ForbiddenException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
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
  GetCommentRequest,
  GetCommentResponse
} from 'proto/social-network.pb';
import { SOCIAL_NETWORK_SERVICE_NAME } from 'proto/social-network.pb';
import { Metadata } from '@grpc/grpc-js';
import { CommentService } from './comment.service';

@Controller()
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
  ) {}

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'CreateComment')
  async createComment(data: CreateCommentRequest): Promise<CreateCommentResponse> {
    return await this.commentService.createComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetAllComment')
  async getAllComment(data: GetAllCommentRequest): Promise<GetAllCommentResponse> {
    return await this.commentService.getAllComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetComment')
  async getComment(data: GetCommentRequest): Promise<GetCommentResponse> {
    return await this.commentService.getComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'UpdateComment')
  async updateComment(data: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    return await this.commentService.updateComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'DeleteComment')
  async deleteComment(data: DeleteCommentRequest): Promise<DeleteCommentResponse> {
    return await this.commentService.deleteComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'LikeComment')
  async likeComment(data: LikeCommentRequest): Promise<LikeCommentResponse> {
    return await this.commentService.likeComment(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'UnlikeComment')
  async unlikeComment(data: UnlikeCommentRequest): Promise<UnlikeCommentResponse> {
    return await this.commentService.unlikeComment(data);
  }
}