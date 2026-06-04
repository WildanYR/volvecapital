import { Body, Controller, HttpCode, HttpStatus, Post, Request } from '@nestjs/common';
import { AppRequest } from 'src/types/app-request.type';
import { SocketDispatchTaskDTO } from './dto/socket-dispatch-task.dto';
import { SocketSendEventDTO } from './dto/socket-send-event.dto';
import { SocketSubscribeDTO } from './dto/socket-subscribe.dto';
import { SocketService } from './socket.service';

@Controller('socket')
export class SocketController {
  constructor(
    private readonly socketService: SocketService
  ) {}

  @Post('send-event')
  @HttpCode(HttpStatus.NO_CONTENT)
  async sendEvent(@Body() socketSendEventDTO: SocketSendEventDTO) {
    await this.socketService.sendEvent(socketSendEventDTO.eventName, socketSendEventDTO.payload);
  }

  @Post('dispatch-task')
  @HttpCode(HttpStatus.NO_CONTENT)
  async dispatchTask(@Body() dispatchTaskDTO: SocketDispatchTaskDTO, @Request() request: AppRequest,) {
    await this.socketService.dispatchTask(dispatchTaskDTO.taskId, request.tenant_id!, dispatchTaskDTO.data);
  }

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async subscribeToEvent(@Body() subscribeToEventDTO: SocketSubscribeDTO) {
    await this.socketService.subscribeClientToEvent(subscribeToEventDTO.clientId, subscribeToEventDTO.eventName);
  }

  @Post('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribeToEvent(@Body() subscribeToEventDTO: SocketSubscribeDTO) {
    await this.socketService.unsubscribeClientToEvent(subscribeToEventDTO.clientId, subscribeToEventDTO.eventName);
  }
}
