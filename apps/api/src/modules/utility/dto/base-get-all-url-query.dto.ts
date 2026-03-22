import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import {
  BaseGetAllUrlQuery,
  ORDER_DIRECTION_OPTIONS,
  OrderDirection,
} from '../types/base-get-all-url-query.type';

export class BaseGetAllUrlQueryDto implements BaseGetAllUrlQuery {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  order_by?: string;

  @IsOptional()
  @IsString()
  @IsIn(ORDER_DIRECTION_OPTIONS)
  order_direction?: OrderDirection;
}
