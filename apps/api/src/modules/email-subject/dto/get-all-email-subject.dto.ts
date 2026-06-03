import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllEmailSubjectQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  context?: string;
}
