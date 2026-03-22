declare class ProductVariantDto {
    name: string;
    duration: number;
    interval: number;
    cooldown: number;
    copy_template?: string;
}
export declare class CreateProductWithVariantDto {
    name: string;
    variants: ProductVariantDto[];
}
export {};
