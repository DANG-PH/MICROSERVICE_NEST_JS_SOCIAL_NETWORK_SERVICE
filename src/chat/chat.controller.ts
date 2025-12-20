import { Controller, InternalServerErrorException, ForbiddenException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
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
import { SOCIAL_NETWORK_SERVICE_NAME } from 'proto/social-network.pb';
import { Metadata } from '@grpc/grpc-js';
import { ChatService } from './chat.service';

@Controller()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'SaveMessage')
  async saveMessage(data: SaveMessageRequest): Promise<SaveMessageResponse> {
    return await this.chatService.saveMessage(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetMessage')
  async getMessage(data: GetMessageRequest): Promise<GetMessageResponse> {
    return await this.chatService.getMessage(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'CreateGroup')
  async createGroup(data: CreateGroupRequest): Promise<CreateGroupResponse> {
    return await this.chatService.createGroup(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'AddUserToGroup')
  async addUserToGroup(data: AddUserToGroupRequest): Promise<AddUserToGroupResponse> {
    return await this.chatService.addUserToGroup(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'CheckGroupUser')
  async checkGroupUser(data: CheckGroupUserRequest): Promise<CheckGroupUserResponse> {
    return await this.chatService.checkGroupUser(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetAllGroup')
  async getAllGroup(data: GetAllGroupRequest): Promise<GetAllGroupResponse> {
    return await this.chatService.getAllGroup(data);
  }
}