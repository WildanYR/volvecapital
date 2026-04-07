import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { PLATFORM_PRODUCT_REPOSITORY } from 'src/constants/database.const';
import { PlatformProduct } from 'src/database/models/platform-product.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreatePlatformProductDto } from './dto/create-platform-product.dto';
import { GetAllPlatformProductByNamesDto } from './dto/get-all-platform-product-by-names.dto';
import { ResolvePlatformProductDto } from './dto/resolve-platform-product.dto';
import { UpdatePlatformProductDto } from './dto/update-platform-product.dto';
import { IPlatformProductGetFilter } from './filter/platform-product-get.filter';

@Injectable()
export class PlatformProductService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(PLATFORM_PRODUCT_REPOSITORY)
    private readonly platformProductRepository: typeof PlatformProduct,
  ) {}

  private normalizeVariant(variant?: string | null) {
    const normalizedVariant = variant?.trim();
    return normalizedVariant || null;
  }

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IPlatformProductGetFilter,
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
      if (filter?.platform) {
        whereOptions.platform = { [Op.iLike]: `%${filter.platform}%` };
      }
      if (filter?.variant) {
        whereOptions.variant = { [Op.iLike]: `%${filter.variant}%` };
      }
      if (filter?.product_variant_id) {
        whereOptions.product_variant_id = filter.product_variant_id;
      }

      const platformProducts
        = await this.platformProductRepository.findAndCountAll({
          where: whereOptions,
          order,
          limit,
          offset,
          include: [
            {
              model: ProductVariant,
              as: 'product_variant',
              attributes: ['id', 'name'],
              include: [
                {
                  model: Product,
                  as: 'product',
                  attributes: ['id', 'name'],
                },
              ],
            },
          ],
          transaction,
        });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        platformProducts.rows,
        platformProducts.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, platformProductId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const platformProduct = await this.platformProductRepository.findOne({
        where: { id: platformProductId },
        include: [
          {
            model: ProductVariant,
            as: 'product_variant',
            attributes: ['id', 'name'],
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        transaction,
      });

      if (!platformProduct) {
        throw new NotFoundException(
          `platformProduct dengan id: ${platformProductId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return platformProduct;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAllByNames(
    tenantId: string,
    getAllPlatformProductByNamesDto: GetAllPlatformProductByNamesDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const platformProduct = await this.platformProductRepository.findAll({
        where: {
          platform: getAllPlatformProductByNamesDto.platform,
          name: getAllPlatformProductByNamesDto.names,
        },
        transaction,
      });

      const platformProductByNames = getAllPlatformProductByNamesDto.names.map(
        (item) => {
          for (const pp of platformProduct) {
            if (item === pp.dataValues.name) {
              return {
                id: pp.id,
                name: pp.dataValues.name,
                product_variant_id: pp.dataValues.product_variant_id,
                isFound: true,
              };
            }
          }
          return {
            name: item,
            isFound: false,
          };
        },
      );

      await transaction.commit();
      return platformProductByNames;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(
    tenantId: string,
    createPlatformProductDto: CreatePlatformProductDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const variant = this.normalizeVariant(createPlatformProductDto.variant);

      const existingPlatformProduct
        = await this.platformProductRepository.count({
          where: {
            name: createPlatformProductDto.name,
            platform: createPlatformProductDto.platform,
            variant,
            product_variant_id: createPlatformProductDto.product_variant_id,
          },
          transaction,
        });

      if (existingPlatformProduct) {
        throw new BadRequestException('Produk Platform sudah ada');
      }

      const newPlatformProduct = await this.platformProductRepository.create(
        {
          ...createPlatformProductDto,
          variant,
        },
        { transaction },
      );
      await transaction.commit();
      return newPlatformProduct;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(
    tenantId: string,
    platformProductId: string,
    updatePlatformProductDto: UpdatePlatformProductDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const platformProduct = await this.platformProductRepository.findOne({
        where: { id: platformProductId },
        transaction,
      });

      if (!platformProduct) {
        throw new NotFoundException(
          `platformProduct dengan id: ${platformProductId} tidak ditemukan`,
        );
      }

      const nextName = updatePlatformProductDto.name ?? platformProduct.name;
      const nextPlatform
        = updatePlatformProductDto.platform ?? platformProduct.platform;
      const nextProductVariantId
        = updatePlatformProductDto.product_variant_id
          ?? platformProduct.product_variant_id;
      const nextVariant = Object.prototype.hasOwnProperty.call(
        updatePlatformProductDto,
        'variant',
      )
        ? this.normalizeVariant(updatePlatformProductDto.variant)
        : this.normalizeVariant(platformProduct.variant);

      const existingPlatformProduct
        = await this.platformProductRepository.count({
          where: {
            id: { [Op.ne]: platformProductId },
            name: nextName,
            platform: nextPlatform,
            variant: nextVariant,
            product_variant_id: nextProductVariantId,
          },
          transaction,
        });

      if (existingPlatformProduct) {
        throw new BadRequestException('Produk Platform sudah ada');
      }

      const updatedValues = {
        ...updatePlatformProductDto,
        ...(Object.prototype.hasOwnProperty.call(updatePlatformProductDto, 'variant')
          ? { variant: nextVariant }
          : {}),
      };

      await platformProduct.update(updatedValues, { transaction });
      await transaction.commit();
      return platformProduct;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, platformProductId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const platformProduct = await this.platformProductRepository.findOne({
        where: { id: platformProductId },
        transaction,
      });

      if (!platformProduct) {
        throw new NotFoundException(
          `platformProduct dengan id: ${platformProductId} tidak ditemukan`,
        );
      }
      await platformProduct.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resolve(
    tenantId: string,
    resolvePlatformProductDto: ResolvePlatformProductDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const resolvedItems = await Promise.all(
        resolvePlatformProductDto.items.map(async (item) => {
          const variant = this.normalizeVariant(item.variant);
          const where: WhereOptions = {
            platform: resolvePlatformProductDto.platform,
            name: item.name,
          };

          if (variant) {
            where.variant = variant;
          }

          const platformProduct = await this.platformProductRepository.findOne({
            where,
            transaction,
          });

          if (!platformProduct) {
            return {
              name: item.name,
              variant: variant ?? undefined,
              isFound: false,
            };
          }

          return {
            id: platformProduct.id,
            name: platformProduct.name,
            variant: platformProduct.variant,
            product_variant_id: platformProduct.product_variant_id,
            isFound: true,
          };
        }),
      );

      await transaction.commit();
      return resolvedItems;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
