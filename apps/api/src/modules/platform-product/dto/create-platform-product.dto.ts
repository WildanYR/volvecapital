import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePlatformProductDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  platform: string;

  @IsOptional()
  @IsString()
  variant?: string;

  @IsOptional()
  @IsString()
  platform_product_id?: string;

  @IsNotEmpty()
  @IsString()
  product_variant_id: string;
}
