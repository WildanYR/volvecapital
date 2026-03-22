import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ModifierData {
  @IsNotEmpty()
  @IsString()
  modifier_id: string;

  @IsOptional()
  @IsString()
  metadata?: string;

  @IsNotEmpty()
  @IsString()
  action: string;
}

export class UpdateAccountModifierDto {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModifierData)
  modifier: ModifierData[];
}
