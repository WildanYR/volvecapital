import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  account_password: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  subscription_expiry: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  billing?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  capital_price?: number;

  @IsOptional()
  @IsString()
  email_id: string;

  @IsOptional()
  @IsString()
  product_variant_id?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  switch_to_harian?: boolean;
}
