import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DispatchTaskDto } from './dto/dispatch-task.dto';
import { SendEventDto } from './dto/send-event.dto';
import { SubscriptionDto } from './dto/subscription.dto';
import { InternalAuthGuard } from './internal-auth.guard';
import { SocketService } from './socket.service';

@UseGuards(InternalAuthGuard)
@Controller('internal')
export class SocketController {
  constructor(private readonly socketService: SocketService) {}

  @Post('tasks/dispatch')
  async dispatchTask(@Body() body: DispatchTaskDto) {
    const clientId = await this.socketService.dispatchTask(
      body.taskId,
      body.tenantId,
      body.dispatchTaskData,
    );

    return { clientId };
  }

  @Post('events/send')
  sendEvent(@Body() body: SendEventDto) {
    this.socketService.sendEvent(body.eventName, body.payload);
    return { success: true };
  }

  @Post('subscriptions/subscribe')
  subscribe(@Body() body: SubscriptionDto) {
    this.socketService.subscribeClientToEvent(body.clientId, body.eventName);
    return { success: true };
  }

  @Post('subscriptions/unsubscribe')
  unsubscribe(@Body() body: SubscriptionDto) {
    this.socketService.unsubscribeClientToEvent(body.clientId, body.eventName);
    return { success: true };
  }

  @Get('connections/:clientId')
  getConnection(@Param('clientId') clientId: string) {
    return this.socketService.getConnection(clientId);
  }
}
