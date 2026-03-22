import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';
export interface ProductAttributes {
    id: string;
    name: string;
    variants?: ProductVariantAttributes[];
    created_at: Date;
    updated_at: Date;
}
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'created_at' | 'updated_at' | 'variants'> {
}
export declare class Product extends Model<ProductAttributes, ProductCreationAttributes> {
    id: string;
    name: string;
    variants?: ProductVariant[];
}
export {};
