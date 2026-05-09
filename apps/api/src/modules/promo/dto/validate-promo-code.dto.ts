import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ValidatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsNumber()
  @IsNotEmpty()
  total_purchase: number;

  @IsString()
  @IsOptional()
  product_variant_id?: string;
}
