import { IsNotEmpty, IsString } from 'class-validator';

export class SendEventDto {
  @IsNotEmpty()
  @IsString()
  eventName: string;

  @IsNotEmpty()
  payload: any;
}
