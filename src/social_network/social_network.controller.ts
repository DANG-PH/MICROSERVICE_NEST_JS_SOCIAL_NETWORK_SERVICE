import { Controller, InternalServerErrorException, ForbiddenException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { SocialNetworkService } from './social_network.service';
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
  CanChatResponse, } from 'proto/social-network.pb';
import { SOCIAL_NETWORK_SERVICE_NAME } from 'proto/social-network.pb';
import { Metadata } from '@grpc/grpc-js';

@Controller()
export class SocialNetworkController {
  constructor(
    private readonly socialNetworkService: SocialNetworkService,
  ) {}

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'AddFriend')
  async addFriend(data: AddFriendRequest): Promise<AddFriendResponse> {
    return await this.socialNetworkService.addFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetSentFriend')
  async getSendFriend(data: GetSentFriendRequest): Promise<GetSentFriendResponse> {
    return await this.socialNetworkService.getSendFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetIncomingFriend')
  async getIncomingFriend(data: GetIncomingFriendRequest): Promise<GetIncomingFriendResponse> {
    return await this.socialNetworkService.getIncomingFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'AcceptFriend')
  async acceptFriend( data: AcceptFriendRequest): Promise<AcceptFriendResponse> {
    return await this.socialNetworkService.acceptFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'RejectFriend')
  async rejectFriend(data: RejectFriendRequest): Promise<RejectFriendResponse> {
    return await this.socialNetworkService.rejectFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetAllFriend')
  async getAllFriend(data: GetAllFriendRequest): Promise<GetAllFriendResponse> {
    return await this.socialNetworkService.getAllFriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'Unfriend')
  async unfriend(data: UnfriendRequest): Promise<UnfriendResponse> {
    return await this.socialNetworkService.unfriend(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'BlockUser')
  async blockUser(data: BlockUserRequest): Promise<BlockUserResponse> {
    return await this.socialNetworkService.blockUser(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'CanChat')
  async canChat(data: CanChatRequest): Promise<CanChatResponse> {
    return await this.socialNetworkService.canChat(data);
  }
}