import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthServiceClient } from 'proto/auth.pb';
import type { GetRealnameAvatarRequest, GetRealnameAvatarResponse } from 'proto/auth.pb';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private authGrpcService: AuthServiceClient;

  constructor(
    @Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.authGrpcService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async handleGetRealnameAvatar(req: GetRealnameAvatarRequest) {
    return firstValueFrom(this.authGrpcService.getRealnameAvatar(req));
  }
}

