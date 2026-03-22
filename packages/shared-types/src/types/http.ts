import { OrderDirection } from "./pagination";

export interface BaseGetAllUrlQuery {
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: OrderDirection;
}