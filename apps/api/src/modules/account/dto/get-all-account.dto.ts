import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllAccountQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  email_id: string;

  @IsOptional()
  @IsString()
  product_variant_id: string;

  @IsOptional()
  @IsString()
  product_id: string;

  @IsOptional()
  @IsString()
  product_slug: string;

  @IsOptional()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  user: string;

  @IsOptional()
  @IsString()
  billing: string;
}
