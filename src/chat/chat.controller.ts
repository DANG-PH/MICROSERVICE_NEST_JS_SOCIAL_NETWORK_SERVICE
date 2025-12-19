import { Controller, InternalServerErrorException, ForbiddenException, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {   
  SaveMessageRequest,
  SaveMessageResponse,
  GetMessageRequest,
  GetMessageResponse
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
}