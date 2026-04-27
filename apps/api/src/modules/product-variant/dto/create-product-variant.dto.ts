import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductVariantDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @IsNotEmpty()
  @IsNumber()
  interval: number;

  @IsNotEmpty()
  @IsNumber()
  cooldown: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  copy_template?: string;

  @IsOptional()
  @IsNumber()
  voucher_expiry_hours?: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  product_id: string;

  @IsOptional()
  redeem_display_config?: any;
}
