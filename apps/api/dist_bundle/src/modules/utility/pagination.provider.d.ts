import { BaseGetAllUrlQuery } from './types/base-get-all-url-query.type';
import { IPaginationResponse, OrderType } from './types/pagination.type';
export declare class PaginationProvider {
    generatePaginationQuery(baseUrlQuery?: BaseGetAllUrlQuery): {
        limit: number;
        offset: number;
        order: OrderType;
    };
    generatePaginationResponse<ItemType>(items: ItemType[], totalItems: number, baseUrlQuery?: BaseGetAllUrlQuery): IPaginationResponse<ItemType>;
    separateUrlParameter<FilterType>(urlQueryData: Record<string, any>): {
        pagination: Partial<BaseGetAllUrlQuery>;
        filter: Record<string, any>;
    };
}
