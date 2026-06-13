import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class MoveAccountUserDto {
  @IsNotEmpty()
  @IsString()
  to_account_id: string;

  @IsNotEmpty()
  @IsString()
  to_profile_id: string;

  @IsNotEmpty()
  @IsString()
  reason: string;
}
