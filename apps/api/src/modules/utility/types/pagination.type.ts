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

// Tipe untuk model class di Sequelize, bisa disederhanakan menjadi 'any' jika sulit
// Tipe ini merepresentasikan konstruktor dari sebuah model

// Definisikan arah pengurutan yang valid
type OrderDirection = 'ASC' | 'DESC';

// 1. Tipe untuk pengurutan sederhana, misal: ['name', 'DESC']
// Kita gunakan tuple untuk memastikan array punya tepat 2 elemen dengan tipe yang benar
type SimpleOrderItem = [string, OrderDirection];

// 2. Tipe untuk pengurutan via relasi, misal: [{ model: ... }, 'name', 'ASC']
type AssociatedOrderItem<T extends typeof Model> = [
  { model: T; as: string },
  string,
  OrderDirection,
];

// 3. Gabungkan keduanya menjadi satu tipe OrderItem
// Sebuah OrderItem bisa berupa SimpleOrderItem ATAU AssociatedOrderItem
export type OrderItem = SimpleOrderItem | AssociatedOrderItem<any>;

// 4. Tipe Order final adalah sebuah array dari CustomOrderItem
export type OrderType = OrderItem[];
