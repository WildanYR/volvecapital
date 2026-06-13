import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLabelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsNotEmpty()
  @IsString()
  product_variant_id: string;
}
