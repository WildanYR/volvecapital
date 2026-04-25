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
import { UpdatePlatformProductDto } from './dto/update-platform-product.dto';
import { PlatformProductService } from './platform-product.service';

@Controller('platform-product')
export class PlatformProductController {
  constructor(
    private readonly platformProductService: PlatformProductService,
    private readonly paginationProvider: PaginationProvider,
  ) {}

  @Get()
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
  findById(@Param('id') id: string, @Request() request: AppRequest) {
    return this.platformProductService.findOne(request.tenant_id!, id);
  }

  @Post()
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
