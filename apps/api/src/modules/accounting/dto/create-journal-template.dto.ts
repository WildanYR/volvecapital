import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateJournalTemplateItemDto {
  @IsString()
  @IsOptional()
  coa_id?: string;

  @IsEnum(['DEBIT', 'CREDIT'])
  @IsNotEmpty()
  position: 'DEBIT' | 'CREDIT';
}

export class CreateJournalTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateJournalTemplateItemDto)
  items: CreateJournalTemplateItemDto[];
}
