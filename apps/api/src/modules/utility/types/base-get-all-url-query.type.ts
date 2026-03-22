export type OrderDirection = 'asc' | 'ASC' | 'desc' | 'DESC';
export const ORDER_DIRECTION_OPTIONS = ['asc', 'ASC', 'desc', 'DESC'];

export interface BaseGetAllUrlQuery {
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: OrderDirection;
}

export const BASE_GET_ALL_URL_QUERY_KEYS: (keyof BaseGetAllUrlQuery)[] = [
  'page',
  'limit',
  'order_by',
  'order_direction',
];
