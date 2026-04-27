import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateTutorialDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  thumbnail_url?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsArray()
  @IsOptional()
  steps?: any[];
}
