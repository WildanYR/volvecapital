import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @IsNumber()
  @Min(50000)
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  bank_account_id: string;
}
