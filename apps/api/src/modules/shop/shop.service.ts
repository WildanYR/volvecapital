import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SHOP_REPOSITORY } from 'src/constants/database.const';
import { Shop } from 'src/database/models/shop.model';
import { CreateShopDto } from './dto/create-shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';
import { PostgresProvider } from '../../database/postgres.provider';

@Injectable()
export class ShopService {
  constructor(
    @Inject(SHOP_REPOSITORY)
    private shopRepository: typeof Shop,
    private postgresProvider: PostgresProvider,
  ) {}

  async create(tenantId: string, createShopDto: CreateShopDto): Promise<Shop> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shop = await this.shopRepository.create(createShopDto as any, { transaction });
      await transaction.commit();
      return shop;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async findAll(tenantId: string): Promise<Shop[]> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shops = await this.shopRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return shops;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async findOne(tenantId: string, id: string): Promise<Shop> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shop = await this.shopRepository.findByPk(id, { transaction });
      await transaction.commit();
      if (!shop) {
        throw new NotFoundException(`Shop with ID ${id} not found`);
      }
      return shop;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
  
  async findByName(tenantId: string, name: string): Promise<Shop | null> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shop = await this.shopRepository.findOne({ where: { name }, transaction });
      await transaction.commit();
      return shop;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async update(tenantId: string, id: string, updateShopDto: UpdateShopDto): Promise<Shop> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shop = await this.shopRepository.findByPk(id, { transaction });
      if (!shop) {
        throw new NotFoundException(`Shop with ID ${id} not found`);
      }
      await shop.update(updateShopDto as any, { transaction });
      await transaction.commit();
      return shop;
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const shop = await this.shopRepository.findByPk(id, { transaction });
      if (!shop) {
        throw new NotFoundException(`Shop with ID ${id} not found`);
      }
      await shop.destroy({ transaction });
      await transaction.commit();
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }
}
