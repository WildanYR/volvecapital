import { ProductVariant } from 'src/database/models/product-variant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { IProductVariantGetFilter } from './filter/product-variant-get.filter';
export declare class ProductVariantService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly productVariantRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, productVariantRepository: typeof ProductVariant);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: IProductVariantGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<ProductVariant>>;
    findOne(tenantId: string, productVariantId: string): Promise<ProductVariant>;
    create(tenantId: string, createProductVariantDto: CreateProductVariantDto): Promise<ProductVariant>;
    update(tenantId: string, productVariantId: string, updateProductVariantDto: UpdateProductVariantDto): Promise<ProductVariant>;
    remove(tenantId: string, productVariantId: string): Promise<void>;
}
