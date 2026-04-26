import { IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetEmailMessageQueryDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  recipient_email?: string;
}
