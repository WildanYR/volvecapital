import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateAccountUserDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  account_profile_id: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expired_at?: Date;
}
