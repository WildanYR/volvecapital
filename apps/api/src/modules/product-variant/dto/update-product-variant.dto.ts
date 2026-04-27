import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateProductVariantDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  duration: number;

  @IsOptional()
  @IsNumber()
  interval: number;

  @IsOptional()
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

  @IsOptional()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  product_id: string;

  @IsOptional()
  redeem_display_config?: any;
}
