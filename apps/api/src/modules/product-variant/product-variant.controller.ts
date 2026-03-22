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
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { GetAllProductVariantQueryUrlDto } from './dto/get-all-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariantService } from './product-variant.service';

@Controller('product-variant')
export class ProductVariantController {
  constructor(
    private readonly productVariantService: ProductVariantService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  findAll(
    @Query() query: GetAllProductVariantQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.productVariantService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.productVariantService.findOne(request.tenant_id!, id);
  }

  @Post()
  create(
    @Body() createProductVariantDto: CreateProductVariantDto,
    @Request() request: AppRequest,
  ) {
    return this.productVariantService.create(
      request.tenant_id!,
      createProductVariantDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  update(
    @Param('id') productVariantId: string,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
    @Request() request: AppRequest,
  ) {
    return this.productVariantService.update(
      request.tenant_id!,
      productVariantId,
      updateProductVariantDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id') productVariantId: string,
    @Request() request: AppRequest,
  ) {
    return this.productVariantService.remove(
      request.tenant_id!,
      productVariantId,
    );
  }
}
