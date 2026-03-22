declare class CreateTransactionItemDto {
    product_variant_id: string;
    account_profile_id?: string;
}
export declare class CreateTransactionDto {
    id: string;
    customer: string;
    platform: string;
    total_price: number;
    items: CreateTransactionItemDto[];
}
export {};
