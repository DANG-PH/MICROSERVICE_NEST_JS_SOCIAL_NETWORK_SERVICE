import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import type {   
    CreateNotificationRequest,
    CreateNotificationResponse,
    GetNotificationByUserRequest,
    GetNotificationByUserResponse
  } from 'proto/social-network.pb';
import { NotificationEntity } from './notification.entity';
import { title } from 'process';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async createNotification(req: CreateNotificationRequest): Promise<CreateNotificationResponse> {
    const notification = req.notification;
    if (!notification) throw new RpcException({status: status.INVALID_ARGUMENT, message: "Thiếu trường dữ liệu"})
    const notificationSave = this.repo.create({
        userId: notification.userId,
        title: notification.title,
        content: notification.content
    });

    const saved = await this.repo.save(notificationSave);
    
    return {
        success: true
    }
  }

  async getNotificationByUser(req: GetNotificationByUserRequest): Promise<GetNotificationByUserResponse> {
    const notifications = await this.repo.find({
        where: { userId: req.userId },
        order: { createdAt: 'ASC' }
    });

    const notificationTraVe = notifications.map(notification => {
        return {
            userId: notification.userId,
            title: notification.title,
            content: notification.content
        };
      });

    return {
        notification: notificationTraVe
    }
  }
}
