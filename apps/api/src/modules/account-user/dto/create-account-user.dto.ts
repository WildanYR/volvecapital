import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateTransactionDto {
  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsNotEmpty()
  @IsNumber()
  total_price: number;
}

export class CreateAccountUserDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  product_variant_id: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  account_profile_id?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTransactionDto)
  transaction?: CreateTransactionDto;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expired_at?: Date;
}
