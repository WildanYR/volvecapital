import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { PRODUCT_VARIANT_REPOSITORY } from 'src/constants/database.const';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { IProductVariantGetFilter } from './filter/product-variant-get.filter';

@Injectable()
export class ProductVariantService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IProductVariantGetFilter,
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
      if (filter?.product_id) {
        whereOptions.product_id = filter.product_id;
      }

      const productVariants
        = await this.productVariantRepository.findAndCountAll({
          where: whereOptions,
          order,
          limit,
          offset,
          include: [
            {
              model: Product,
              as: 'product',
              where:
                filter?.product && !filter.product_id
                  ? { name: { [Op.iLike]: `%${filter.product}%` } }
                  : undefined,
            },
          ],
          transaction,
        });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        productVariants.rows,
        productVariants.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, productVariantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const productVariant = await this.productVariantRepository.findOne({
        where: { id: productVariantId },
        include: [{ model: Product, as: 'product' }],
        transaction,
      });

      if (!productVariant) {
        throw new NotFoundException(
          `productVariant dengan id: ${productVariantId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return productVariant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(
    tenantId: string,
    createProductVariantDto: CreateProductVariantDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingProductVariant = await this.productVariantRepository.count({
        where: {
          name: createProductVariantDto.name,
          product_id: createProductVariantDto.product_id,
        },
        transaction,
      });

      if (existingProductVariant) {
        throw new BadRequestException('Varian produk sudah ada');
      }

      const newProductVariant = await this.productVariantRepository.create(
        { ...createProductVariantDto },
        { transaction },
      );
      await transaction.commit();
      return newProductVariant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    tenantId: string,
    productVariantId: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const productVariant = await this.productVariantRepository.findOne({
        where: { id: productVariantId },
        transaction,
      });

      if (!productVariant) {
        throw new NotFoundException(
          `productVariant dengan id: ${productVariantId} tidak ditemukan`,
        );
      }

      await productVariant.update(
        { ...updateProductVariantDto },
        { transaction },
      );
      await transaction.commit();
      return productVariant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, productVariantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const productVariant = await this.productVariantRepository.findOne({
        where: { id: productVariantId },
        transaction,
      });

      if (!productVariant) {
        throw new NotFoundException(
          `productVariant dengan id: ${productVariantId} tidak ditemukan`,
        );
      }
      await productVariant.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
