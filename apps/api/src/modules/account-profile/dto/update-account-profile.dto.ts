import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccountProfileDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  max_user: number;

  @IsOptional()
  @IsBoolean()
  allow_generate: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;
}
