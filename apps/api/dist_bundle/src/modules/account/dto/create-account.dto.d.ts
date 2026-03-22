declare class CreateAccountProfileDto {
    name: string;
    max_user: number;
    allow_generate: boolean;
    metadata?: string;
}
declare class CreateAccountModifierDto {
    modifier_id: string;
    metadata: string;
}
export declare class CreateAccountDto {
    account_password: string;
    subscription_expiry: Date;
    status?: string;
    billing?: string;
    label?: string;
    email_id: string;
    product_variant_id: string;
    profile: CreateAccountProfileDto[];
    modifier?: CreateAccountModifierDto[];
}
export {};
