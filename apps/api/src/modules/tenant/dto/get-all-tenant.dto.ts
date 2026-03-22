import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllTenantQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  tenant_id?: string;
}
