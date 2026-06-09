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
import { CreatePlatformProductDto } from './dto/create-platform-product.dto';
import { GetAllPlatformProductByNamesDto } from './dto/get-all-platform-product-by-names.dto';
import { GetAllPlatformProductQueryUrlDto } from './dto/get-all-platform-product.dto';
import { ResolvePlatformProductDto } from './dto/resolve-platform-product.dto';
import { UpdatePlatformProductDto } from './dto/update-platform-product.dto';
import { RequirePermissions } from 'src/guards/permissions.decorator';
import { PlatformProductService } from './platform-product.service';

@Controller('platform-product')
export class PlatformProductController {
  constructor(
    private readonly platformProductService: PlatformProductService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
  @RequirePermissions('platform_product.view')
  findAll(
    @Query() query: GetAllPlatformProductQueryUrlDto,
    @Request() request: AppRequest,
  ) {
    const { pagination, filter }
      = this.paginationProvider.separateUrlParameter(query);
    return this.platformProductService.findAll(
      request.tenant_id!,
      pagination,
      filter,
    );
  }

  @Get('by-names')
  @RequirePermissions('platform_product.view')
  findAllByNames(
    @Query() query: GetAllPlatformProductByNamesDto,
    @Request() request: AppRequest,
  ) {
    return this.platformProductService.findAllByNames(
      request.tenant_id!,
      query,
    );
  }

  @Get(':id')
  @RequirePermissions('platform_product.view')
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.platformProductService.findOne(request.tenant_id!, id);
  }

  @Post('resolve')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('platform_product.edit')
  resolve(
    @Body() resolvePlatformProductDto: ResolvePlatformProductDto,
    @Request() request: AppRequest,
  ) {
    return this.platformProductService.resolve(
      request.tenant_id!,
      resolvePlatformProductDto,
    );
  }

  @Post()
  @RequirePermissions('platform_product.create')
  create(
    @Body() createPlatformProductDto: CreatePlatformProductDto,
    @Request() request: AppRequest,
  ) {
    return this.platformProductService.create(
      request.tenant_id!,
      createPlatformProductDto,
    );
  }

  @Patch(':id')
  @UsePipes(AtLeastOnePropertyPipe)
  @RequirePermissions('platform_product.edit')
  update(
    @Param('id') platformProductId: string,
    @Body() updatePlatformProductDto: UpdatePlatformProductDto,
    @Request() request: AppRequest,
  ) {
    return this.platformProductService.update(
      request.tenant_id!,
      platformProductId,
      updatePlatformProductDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('platform_product.delete')
  remove(
    @Param('id') platformProductId: string,
    @Request() request: AppRequest,
  ) {
    return this.platformProductService.remove(
      request.tenant_id!,
      platformProductId,
    );
  }
}
