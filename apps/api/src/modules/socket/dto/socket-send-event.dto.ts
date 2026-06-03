import { IsNotEmpty, IsString } from 'class-validator';

export class SocketSendEventDTO {
  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsNotEmpty()
  @IsString()
  payload: string;
}
