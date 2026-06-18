import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateManualBookDto {
  @IsUUID()
  category_id: string;

  @IsString()
  title: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'])
  status?: string;
}
