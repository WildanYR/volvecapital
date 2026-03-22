export type OrderDirection = 'asc' | 'ASC' | 'desc' | 'DESC';
export declare const ORDER_DIRECTION_OPTIONS: string[];
export interface BaseGetAllUrlQuery {
    page?: number;
    limit?: number;
    order_by?: string;
    order_direction?: OrderDirection;
}
export declare const BASE_GET_ALL_URL_QUERY_KEYS: (keyof BaseGetAllUrlQuery)[];
