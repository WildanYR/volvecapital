import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UsePipes,
} from '@nestjs/common';
import { AtLeastOnePropertyPipe } from 'src/pipes/at-least-one-property.pipe';
import { AppRequest } from 'src/types/app-request.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { CreateProductWithVariantDto } from './dto/create-product-with-variant.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { GetAllProductQueryUrlDto } from './dto/get-all-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllProductQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.productService.findAll(request.tenant_id!, pagination, filter);
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.productService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @Request() request: AppRequest,
  ) {
    return this.productService.create(request.tenant_id!, createProductDto);
  }

  @Post('with-variant')
  createWithVariant(
    @Body() createProductWithVariantDto: CreateProductWithVariantDto,
    @Request() request: AppRequest,
  ) {
    return this.productService.createWithVariant(
      request.tenant_id!,
      createProductWithVariantDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() request: AppRequest,
  ) {
    return this.productService.update(
      request.tenant_id!,
      productId,
      updateProductDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') productId: string, @Request() request: AppRequest) {
    return this.productService.remove(request.tenant_id!, productId);
  }
}
