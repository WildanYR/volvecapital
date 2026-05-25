import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  subject_id?: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}
