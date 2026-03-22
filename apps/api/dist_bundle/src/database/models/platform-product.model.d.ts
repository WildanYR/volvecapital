import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { ProductVariant, ProductVariantAttributes } from './product-variant.model';
export interface PlatformProductAttributes {
    id: string;
    name: string;
    platform: string;
    platform_product_id?: string;
    product_variant_id: string;
    product_variant: ProductVariantAttributes;
    created_at: Date;
    updated_at: Date;
}
interface PlatformProductCreationAttributes extends Optional<PlatformProductAttributes, 'id' | 'created_at' | 'updated_at' | 'product_variant'> {
}
export declare class PlatformProduct extends Model<PlatformProductAttributes, PlatformProductCreationAttributes> {
    id: string;
    name: string;
    platform: string;
    platform_product_id?: string;
    product_variant_id: string;
    product_variant: ProductVariant;
}
export {};
