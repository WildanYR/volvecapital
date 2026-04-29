import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class CreateAccountProfileDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  max_user: number;

  @IsNotEmpty()
  @IsBoolean()
  allow_generate: boolean;

  @IsOptional()
  @IsString()
  metadata?: string;
}

class CreateAccountModifierDto {
  @IsNotEmpty()
  @IsString()
  modifier_id: string;

  @IsNotEmpty()
  @IsString()
  metadata: string;
}

export class CreateAccountDto {
  @IsNotEmpty()
  @IsString()
  account_password: string;

  @IsNotEmpty()
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

  @IsNotEmpty()
  @IsString()
  email_id: string;

  @IsNotEmpty()
  @IsString()
  product_variant_id: string;

  // profile
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAccountProfileDto)
  profile: CreateAccountProfileDto[];

  // modifier
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAccountModifierDto)
  modifier?: CreateAccountModifierDto[];
}
