import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllProductVariantQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  product?: string;

  @IsOptional()
  @IsString()
  product_slug?: string;
}
