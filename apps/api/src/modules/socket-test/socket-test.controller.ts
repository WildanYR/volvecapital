import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PublicRoute } from 'src/guards/public-route.decorator';
import { SocketGateway } from '../socket/socket.gateway';
import { DispatchTaskDto } from './dto/dispatch-task.dto';
import { SendEventDto } from './dto/send-event.dto';
import { SubscriptionDto } from './dto/subscription.dto';

@PublicRoute()
@Controller('socket-test')
export class SocketTestController {
  constructor(private readonly socketGateway: SocketGateway) {}

  @Post('dispatch-task')
  async dispatchTask(@Body() body: DispatchTaskDto) {
    const clientId = await this.socketGateway.dispatchTask(
      body.taskId,
      body.tenantId,
      body.dispatchTaskData,
    );

    return {
      success: true,
      clientId: clientId ?? null,
    };
  }

  @Post('send-event')
  async sendEvent(@Body() body: SendEventDto) {
    await this.socketGateway.sendEvent(body.eventName, body.payload);
    return { success: true };
  }

  @Post('subscribe')
  async subscribe(@Body() body: SubscriptionDto) {
    await this.socketGateway.subscribeClientToEvent(body.clientId, body.eventName);
    return { success: true };
  }

  @Post('unsubscribe')
  async unsubscribe(@Body() body: SubscriptionDto) {
    await this.socketGateway.unsubscribeClientToEvent(body.clientId, body.eventName);
    return { success: true };
  }

  @Get('connection/:clientId')
  async getConnection(@Param('clientId') clientId: string): Promise<{
    success: true;
    connection: Awaited<ReturnType<SocketGateway['getConnection']>>;
  }> {
    return {
      success: true,
      connection: await this.socketGateway.getConnection(clientId),
    };
  }
}
