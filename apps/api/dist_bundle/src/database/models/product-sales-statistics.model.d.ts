import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
export interface ProductSalesStatisticsAttributes {
    date: string;
    type: string;
    product_variant_id: string;
    items_sold: number;
    created_at: Date;
    updated_at: Date;
}
interface ProductSalesStatisticsCreationAttributes extends Optional<ProductSalesStatisticsAttributes, 'created_at' | 'updated_at'> {
}
export declare class ProductSalesStatistics extends Model<ProductSalesStatisticsAttributes, ProductSalesStatisticsCreationAttributes> {
    date: string;
    type: string;
    product_variant_id: string;
    items_sold: number;
}
export {};
