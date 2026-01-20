import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  providers: [NotificationService],
  exports: [NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}