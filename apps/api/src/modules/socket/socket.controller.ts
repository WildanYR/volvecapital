import { Controller, Get, Request } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { AppRequest } from 'src/types/app-request.type';
import { RequirePermissions } from 'src/guards/permissions.decorator';

@Controller('socket')
export class SocketController {
  constructor(private readonly socketGateway: SocketGateway) {}

  @Get('active-bots')
  @RequirePermissions('account.view')
  getActiveBots(@Request() request: AppRequest) {
    return this.socketGateway.getActiveBots(request.tenant_id!);
  }
}
