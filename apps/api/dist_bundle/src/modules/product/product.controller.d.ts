import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateProductWithVariantDto } from './dto/create-product-with-variant.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetAllProductQueryUrlDto } from './dto/get-all-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';
export declare class ProductController {
    private readonly productService;
    private readonly paginationProvider;
    constructor(productService: ProductService, paginationProvider: PaginationProvider);
    findAll(query: GetAllProductQueryUrlDto, request: AppRequest): Promise<import("../utility/types/pagination.type").IPaginationResponse<import("../../database/models/product.model").Product>>;
    findById(id: string, request: AppRequest): Promise<import("../../database/models/product.model").Product>;
    create(createProductDto: CreateProductDto, request: AppRequest): Promise<import("../../database/models/product.model").Product>;
    createWithVariant(createProductWithVariantDto: CreateProductWithVariantDto, request: AppRequest): Promise<import("../../database/models/product.model").Product | null>;
    update(productId: string, updateProductDto: UpdateProductDto, request: AppRequest): Promise<import("../../database/models/product.model").Product>;
    remove(productId: string, request: AppRequest): Promise<void>;
}
