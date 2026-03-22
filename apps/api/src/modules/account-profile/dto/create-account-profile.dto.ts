import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAccountProfileDto {
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

  @IsNotEmpty()
  @IsString()
  account_id: string;
}
