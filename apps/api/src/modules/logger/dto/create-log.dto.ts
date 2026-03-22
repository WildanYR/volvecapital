import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLogDto {
  @IsNotEmpty()
  @IsString()
  level: string;

  @IsNotEmpty()
  @IsString()
  context: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  created_at?: Date;
}
