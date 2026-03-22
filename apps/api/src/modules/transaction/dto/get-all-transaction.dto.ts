import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { BaseGetAllUrlQueryDto } from 'src/modules/utility/dto/base-get-all-url-query.dto';

export class GetAllTransactionQueryUrlDto extends BaseGetAllUrlQueryDto {
  @IsOptional()
  @IsString()
  customer?: string;

  @IsOptional()
  @IsString()
  platform?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from_date?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to_date?: Date;
}
