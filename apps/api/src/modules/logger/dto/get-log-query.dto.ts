import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetLogQueryDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
