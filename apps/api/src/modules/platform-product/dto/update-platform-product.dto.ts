import { IsOptional, IsString } from 'class-validator';

export class UpdatePlatformProductDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  platform: string;

  @IsOptional()
  @IsString()
  platform_product_id?: string;

  @IsOptional()
  @IsString()
  product_variant_id: string;
}
