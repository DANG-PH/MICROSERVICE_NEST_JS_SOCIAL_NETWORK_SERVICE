import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import type {   
  CreateNotificationRequest,
  CreateNotificationResponse,
  GetNotificationByUserRequest,
  GetNotificationByUserResponse
} from 'proto/social-network.pb';
import { SOCIAL_NETWORK_SERVICE_NAME } from 'proto/social-network.pb';
import { Metadata } from '@grpc/grpc-js';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'CreateNotification')
  async createComment(data: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    return await this.notificationService.createNotification(data);
  }

  @GrpcMethod(SOCIAL_NETWORK_SERVICE_NAME, 'GetNotificationByUser')
  async getAllComment(data: GetNotificationByUserRequest): Promise<GetNotificationByUserResponse> {
    return await this.notificationService.getNotificationByUser(data);
  }
}