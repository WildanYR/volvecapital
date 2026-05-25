import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateTransactionItemDto {
  @IsNotEmpty()
  @IsString()
  product_variant_id: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  account_profile_id?: string;
}

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  customer: string;

  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];
}
