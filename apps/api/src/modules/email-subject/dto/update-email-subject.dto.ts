import { IsOptional, IsString } from 'class-validator';

export class UpdateEmailSubjectDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsString()
  extract_method?: string;
}
