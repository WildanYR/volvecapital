export type OrderDirection = 'ASC' | 'DESC';

export interface IPaginationData {
  currentPage: number;
  totalPage: number;
  limit: number;
  totalItems: number;
}

export interface IOrderByData {
  orderBy: string;
  orderDirection: OrderDirection;
}

export interface IPaginationResponse<T> {
  items: T[];
  paginationData: IPaginationData;
  orderData: IOrderByData;
}