import { IsNotEmpty, IsString } from 'class-validator';

export class SubscriptionDto {
  @IsNotEmpty()
  @IsString()
  clientId: string;

  @IsNotEmpty()
  @IsString()
  eventName: string;
}
