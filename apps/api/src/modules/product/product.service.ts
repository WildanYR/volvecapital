import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
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
      if (filter?.slug) {
        whereOptions.slug = filter.slug;
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
    console.log('DEBUG: findOne called with', { tenantId, productId });
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const where: WhereOptions = /^\d+$/.test(productId)
        ? { [Op.or]: [{ id: productId }, { slug: productId }] }
        : { slug: productId };

      console.log('DEBUG: where options', where);

      const product = await this.productRepository.findOne({
        where,
        include: [{ model: ProductVariant, as: 'variants' }],
        transaction,
      });

      if (!product) {
        console.log('DEBUG: product not found');
        throw new NotFoundException(
          `product dengan id atau slug: ${productId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return product;
    }
    catch (error) {
      console.error('DEBUG: error in findOne', error);
      await transaction.rollback();
      throw error;
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  async create(tenantId: string, createProductDto: CreateProductDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingProduct = await this.productRepository.count({
        where: {
          [Op.or]: [
            { name: createProductDto.name },
            { slug: createProductDto.slug || this.slugify(createProductDto.name) },
          ],
        },
        transaction,
      });

      if (existingProduct) {
        throw new BadRequestException('Produk atau slug sudah ada');
      }

      const newProduct = await this.productRepository.create(
        {
          ...createProductDto,
          slug: createProductDto.slug || this.slugify(createProductDto.name),
        },
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
        where: {
          [Op.or]: [
            { name: createProductWithVariantDto.name },
            { slug: createProductWithVariantDto.slug || this.slugify(createProductWithVariantDto.name) },
          ],
        },
        transaction,
      });

      if (existingProduct) {
        throw new BadRequestException('Produk atau slug sudah ada');
      }

      const product = await this.productRepository.create(
        {
          name: createProductWithVariantDto.name,
          slug: createProductWithVariantDto.slug || this.slugify(createProductWithVariantDto.name),
        },
        { transaction },
      );

      const variantData = createProductWithVariantDto.variants.map(
        variant => ({
          name: variant.name,
          duration: variant.duration,
          interval: variant.interval,
          cooldown: variant.cooldown,
          price: variant.price,
          copy_template: variant.copy_template,
          description: variant.description,
          product_id: product.id,
        }),
      );
      await this.productVariantRepository.bulkCreate(variantData as any, {
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

  async getPoolingStats(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const stats = await this.postgresProvider.rawQuery(
        `
        SELECT 
          p.id, 
          p.name, 
          p.slug,
          CAST(COUNT(a.id) AS INTEGER) as total,
          CAST(COUNT(CASE WHEN (a.status IN ('ready', 'active') AND a.subscription_expiry > NOW()) THEN 1 END) AS INTEGER) as active,
          CAST(COUNT(CASE WHEN (a.status = 'disable' OR a.subscription_expiry <= NOW()) THEN 1 END) AS INTEGER) as expired
        FROM product p
        LEFT JOIN product_variant pv ON pv.product_id = p.id
        LEFT JOIN account a ON a.product_variant_id = pv.id
        GROUP BY p.id, p.name, p.slug
        ORDER BY p.name ASC
        `,
        {
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      await transaction.commit();
      return stats;
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

      await product.update({ ...updateProductDto }, { transaction });
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
