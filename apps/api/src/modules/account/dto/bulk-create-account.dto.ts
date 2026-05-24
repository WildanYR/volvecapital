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

class BulkCreateAccountProfileDto {
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

export class BulkAccountItemDto {
  @IsNotEmpty()
  @IsString()
  email: string;

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
  product_variant_id: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateAccountProfileDto)
  profile: BulkCreateAccountProfileDto[];
}

export class BulkCreateAccountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAccountItemDto)
  accounts: BulkAccountItemDto[];
}
