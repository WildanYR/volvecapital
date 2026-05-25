import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllExpenseQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  subject_id?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
