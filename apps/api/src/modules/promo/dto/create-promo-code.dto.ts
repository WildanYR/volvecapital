import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(['FIXED', 'PERCENTAGE'])
  type: 'FIXED' | 'PERCENTAGE';

  @IsNumber()
  @Min(0)
  value: number;

  @IsNumber()
  @Min(0)
  max_usage: number;

  @IsNumber()
  @Min(0)
  min_purchase: number;

  @IsDateString()
  @IsOptional()
  start_date?: string;

  @IsDateString()
  @IsOptional()
  end_date?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  product_variant_id?: string;
}

export class UpdatePromoCodeDto extends CreatePromoCodeDto {}
