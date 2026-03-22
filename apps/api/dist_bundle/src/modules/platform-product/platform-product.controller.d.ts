import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreatePlatformProductDto } from './dto/create-platform-product.dto';
import { GetAllPlatformProductByNamesDto } from './dto/get-all-platform-product-by-names.dto';
import { GetAllPlatformProductQueryUrlDto } from './dto/get-all-platform-product.dto';
import { UpdatePlatformProductDto } from './dto/update-platform-product.dto';
import { PlatformProductService } from './platform-product.service';
export declare class PlatformProductController {
    private readonly platformProductService;
    private readonly paginationProvider;
    constructor(platformProductService: PlatformProductService, paginationProvider: PaginationProvider);
    findAll(query: GetAllPlatformProductQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/platform-product.model").PlatformProduct>>;
    findAllByNames(query: GetAllPlatformProductByNamesDto, request: AppRequest): Promise<({
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
    findById(id: string, request: AppRequest): Promise<import("../../database/models/platform-product.model").PlatformProduct>;
    create(createPlatformProductDto: CreatePlatformProductDto, request: AppRequest): Promise<import("../../database/models/platform-product.model").PlatformProduct>;
    update(platformProductId: string, updatePlatformProductDto: UpdatePlatformProductDto, request: AppRequest): Promise<import("../../database/models/platform-product.model").PlatformProduct>;
    remove(platformProductId: string, request: AppRequest): Promise<void>;
}
