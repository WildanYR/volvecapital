import { IsNotEmpty, IsString } from 'class-validator';

export class SocketSubscribeDTO {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  eventName: string;
}
