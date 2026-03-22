import { Optional } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Account, AccountAttributes } from './account.model';
import { PlatformProduct, PlatformProductAttributes } from './platform-product.model';
import { Product, ProductAttributes } from './product.model';
export interface ProductVariantAttributes {
    id: string;
    name: string;
    duration: number;
    interval: number;
    cooldown: number;
    copy_template?: string;
    product_id: string;
    product: ProductAttributes;
    platform_product?: PlatformProductAttributes[];
    account?: AccountAttributes[];
    created_at: Date;
    updated_at: Date;
}
interface ProductVariantCreationAttributes extends Optional<ProductVariantAttributes, 'id' | 'created_at' | 'updated_at' | 'product' | 'platform_product' | 'account'> {
}
export declare class ProductVariant extends Model<ProductVariantAttributes, ProductVariantCreationAttributes> {
    id: string;
    name: string;
    duration: number;
    interval: number;
    cooldown: number;
    copy_template?: string;
    product_id: string;
    product: Product;
    platform_product?: PlatformProduct[];
    account?: Account[];
}
export {};
