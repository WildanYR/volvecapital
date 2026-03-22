import type { Model } from 'sequelize-typescript';
export interface IPaginationData {
    currentPage: number;
    totalPage: number;
    limit: number;
    totalItems: number;
}
export interface IOrderByData {
    orderBy: string;
    orderDirection: string;
}
export interface IPaginationResponse<T> {
    items: T[];
    paginationData: IPaginationData;
    orderData: IOrderByData;
}
type OrderDirection = 'ASC' | 'DESC';
type SimpleOrderItem = [string, OrderDirection];
type AssociatedOrderItem<T extends typeof Model> = [
    {
        model: T;
        as: string;
    },
    string,
    OrderDirection
];
export type OrderItem = SimpleOrderItem | AssociatedOrderItem<any>;
export type OrderType = OrderItem[];
export {};
