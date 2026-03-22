import { BaseGetAllUrlQuery, OrderDirection } from '../types/base-get-all-url-query.type';
export declare class BaseGetAllUrlQueryDto implements BaseGetAllUrlQuery {
    page?: number;
    limit?: number;
    order_by?: string;
    order_direction?: OrderDirection;
}
