import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RequestWeeklyOffDto {
  @IsString()
  @IsNotEmpty()
  requested_off_day: string;

  @IsString()
  @IsOptional()
  note?: string;
}

export class RejectWeeklyOffDto {
  @IsString()
  @IsOptional()
  note?: string;
}
