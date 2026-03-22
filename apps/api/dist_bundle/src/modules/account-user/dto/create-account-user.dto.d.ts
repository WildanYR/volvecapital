declare class CreateTransactionDto {
    platform: string;
    total_price: number;
}
export declare class CreateAccountUserDto {
    name: string;
    product_variant_id: string;
    status?: string;
    account_profile_id?: string;
    transaction?: CreateTransactionDto;
    expired_at?: Date;
}
export {};
