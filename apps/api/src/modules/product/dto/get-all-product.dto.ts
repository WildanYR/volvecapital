import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllProductQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  name?: string;
}
