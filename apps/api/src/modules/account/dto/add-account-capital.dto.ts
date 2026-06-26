import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddAccountCapitalDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

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
