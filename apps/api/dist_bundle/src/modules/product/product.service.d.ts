import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateProductWithVariantDto } from './dto/create-product-with-variant.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductGetFilter } from './filter/product-get.filter';
export declare class ProductService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly productRepository;
    private readonly productVariantRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, productRepository: typeof Product, productVariantRepository: typeof ProductVariant);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: IProductGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<Product>>;
    findOne(tenantId: string, productId: string): Promise<Product>;
    create(tenantId: string, createProductDto: CreateProductDto): Promise<Product>;
    createWithVariant(tenantId: string, createProductWithVariantDto: CreateProductWithVariantDto): Promise<Product | null>;
    update(tenantId: string, productId: string, updateProductDto: UpdateProductDto): Promise<Product>;
    remove(tenantId: string, productId: string): Promise<void>;
}
