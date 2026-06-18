import { IsOptional, IsString } from 'class-validator';

export class CreateManualBookCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString() // Can also use @IsUUID() if strictly validated
  parent_id?: string;
}
