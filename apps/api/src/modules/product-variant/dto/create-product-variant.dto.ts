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

  @IsNotEmpty()
  @IsString()
  base_price: string;

  @IsOptional()
  @IsString()
  copy_template?: string;

  @IsNotEmpty()
  @IsString()
  product_id: string;
}
