import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddAccountCapitalDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
