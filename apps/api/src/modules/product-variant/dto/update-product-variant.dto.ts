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
  base_price?: string;

  @IsOptional()
  @IsString()
  copy_template?: string;

  @IsOptional()
  @IsString()
  product_id: string;
}
