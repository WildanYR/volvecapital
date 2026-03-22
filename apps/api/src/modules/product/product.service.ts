import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import {
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from 'src/constants/database.const';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateProductWithVariantDto } from './dto/create-product-with-variant.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { IProductGetFilter } from './filter/product-get.filter';

@Injectable()
export class ProductService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: typeof Product,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IProductGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.name) {
        whereOptions.name = { [Op.iLike]: `%${filter.name}%` };
      }

      const products = await this.productRepository.findAndCountAll({
        where: whereOptions,
        order: [
          ...order,
          [{ model: ProductVariant, as: 'variants' }, 'name', 'ASC'],
        ],
        limit,
        offset,
        include: [{ model: ProductVariant, as: 'variants' }],
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        products.rows,
        products.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, productId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const product = await this.productRepository.findOne({
        where: { id: productId },
        include: [{ model: ProductVariant, as: 'variants' }],
        transaction,
      });

      if (!product) {
        throw new NotFoundException(
          `product dengan id: ${productId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return product;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, createProductDto: CreateProductDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingProduct = await this.productRepository.count({
        where: { name: createProductDto.name },
        transaction,
      });

      if (existingProduct) {
        throw new BadRequestException('Produk sudah ada');
      }

      const newProduct = await this.productRepository.create(
        { ...createProductDto },
        { transaction },
      );
      await transaction.commit();
      return newProduct;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createWithVariant(
    tenantId: string,
    createProductWithVariantDto: CreateProductWithVariantDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingProduct = await this.productRepository.count({
        where: { name: createProductWithVariantDto.name },
        transaction,
      });

      if (existingProduct) {
        throw new BadRequestException('Produk sudah ada');
      }

      const product = await this.productRepository.create(
        { name: createProductWithVariantDto.name },
        { transaction },
      );

      const variantData = createProductWithVariantDto.variants.map(
        variant => ({ ...variant, product_id: product.id }),
      );
      await this.productVariantRepository.bulkCreate(variantData, {
        transaction,
      });
      const newProduct = await this.productRepository.findOne({
        where: { id: product.id },
        include: [{ model: ProductVariant, as: 'variants' }],
        transaction,
      });
      await transaction.commit();
      return newProduct;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    tenantId: string,
    productId: string,
    updateProductDto: UpdateProductDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const product = await this.productRepository.findOne({
        where: { id: productId },
        transaction,
      });

      if (!product) {
        throw new NotFoundException(
          `product dengan id: ${productId} tidak ditemukan`,
        );
      }

      await product.update({ ...updateProductDto });
      await transaction.commit();
      return product;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, productId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const product = await this.productRepository.findOne({
        where: { id: productId },
        transaction,
      });

      if (!product) {
        throw new NotFoundException(
          `product dengan id: ${productId} tidak ditemukan`,
        );
      }
      await product.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
