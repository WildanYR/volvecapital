import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAccountCapitalDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  payment_coa_id?: string;

  @IsOptional()
  @IsString()
  expense_coa_id?: string;
}
