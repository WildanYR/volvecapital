import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateExpenseDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  subject_id?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
