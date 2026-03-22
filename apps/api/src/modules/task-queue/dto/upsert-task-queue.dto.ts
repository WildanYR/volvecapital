import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertTaskQueueDto {
  @IsNotEmpty()
  @IsDateString()
  @Type(() => Date)
  execute_at: Date;

  @IsNotEmpty()
  @IsString()
  subject_id: string;

  @IsNotEmpty()
  @IsString()
  context: string;

  @IsNotEmpty()
  @IsString()
  payload: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNotEmpty()
  @IsString()
  tenant_id: string;
}
