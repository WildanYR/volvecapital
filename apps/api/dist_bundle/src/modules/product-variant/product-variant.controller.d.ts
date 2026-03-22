import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { GetAllProductVariantQueryUrlDto } from './dto/get-all-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantService } from './product-variant.service';
export declare class ProductVariantController {
    private readonly productVariantService;
    private readonly paginationProvider;
    constructor(productVariantService: ProductVariantService, paginationProvider: PaginationProvider);
    findAll(query: GetAllProductVariantQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/product-variant.model").ProductVariant>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/product-variant.model").ProductVariant>;
    create(createProductVariantDto: CreateProductVariantDto, request: AppRequest): Promise<import("../../database/models/product-variant.model").ProductVariant>;
    update(productVariantId: string, updateProductVariantDto: UpdateProductVariantDto, request: AppRequest): Promise<import("../../database/models/product-variant.model").ProductVariant>;
    remove(productVariantId: string, request: AppRequest): Promise<void>;
}
