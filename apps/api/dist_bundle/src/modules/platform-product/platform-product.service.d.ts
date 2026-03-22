import { PlatformProduct } from 'src/database/models/platform-product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreatePlatformProductDto } from './dto/create-platform-product.dto';
import { GetAllPlatformProductByNamesDto } from './dto/get-all-platform-product-by-names.dto';
import { UpdatePlatformProductDto } from './dto/update-platform-product.dto';
import { IPlatformProductGetFilter } from './filter/platform-product-get.filter';
export declare class PlatformProductService {
    private readonly paginationProvider;
    private readonly postgresProvider;
    private readonly platformProductRepository;
    constructor(paginationProvider: PaginationProvider, postgresProvider: PostgresProvider, platformProductRepository: typeof PlatformProduct);
    findAll(tenantId: string, pagination?: BaseGetAllUrlQuery, filter?: IPlatformProductGetFilter): Promise<import("../utility/types/pagination.type").IPaginationResponse<PlatformProduct>>;
    findOne(tenantId: string, platformProductId: string): Promise<PlatformProduct>;
    findAllByNames(tenantId: string, getAllPlatformProductByNamesDto: GetAllPlatformProductByNamesDto): Promise<({
        id: string;
        name: string;
        product_variant_id: string;
        isFound: boolean;
    } | {
        name: string;
        isFound: boolean;
        id?: undefined;
        product_variant_id?: undefined;
    })[]>;
    create(tenantId: string, createPlatformProductDto: CreatePlatformProductDto): Promise<PlatformProduct>;
    update(tenantId: string, platformProductId: string, updatePlatformProductDto: UpdatePlatformProductDto): Promise<PlatformProduct>;
    remove(tenantId: string, platformProductId: string): Promise<void>;
}
