import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op } from 'sequelize';
import { PROMO_CODE_REPOSITORY } from 'src/constants/database.const';
import { PromoCode } from 'src/database/models/promo-code.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from './dto/create-promo-code.dto';

@Injectable()
export class PromoService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly paginationProvider: PaginationProvider,
    @Inject(PROMO_CODE_REPOSITORY)
    private readonly promoCodeRepository: typeof PromoCode,
  ) {}

  async findAll(tenantId: string, pagination?: BaseGetAllUrlQuery) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const promoCodes = await this.promoCodeRepository.findAndCountAll({
        order,
        limit,
        offset,
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        promoCodes.rows,
        promoCodes.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const promoCode = await this.promoCodeRepository.findOne({
        where: { id },
        transaction,
      });
      if (!promoCode) throw new NotFoundException('Promo code not found');
      await transaction.commit();
      return promoCode;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, dto: CreatePromoCodeDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      const existing = await this.promoCodeRepository.findOne({
        where: { code: dto.code.toUpperCase() },
        transaction,
      });
      if (existing) throw new BadRequestException('Code already exists');

      const promoCode = await this.promoCodeRepository.create(
        {
          ...dto,
          code: dto.code.toUpperCase(),
        },
        { transaction },
      );

      await transaction.commit();
      return promoCode;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpdatePromoCodeDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const promoCode = await this.promoCodeRepository.findOne({
        where: { id },
        transaction,
      });
      if (!promoCode) throw new NotFoundException('Promo code not found');

      await promoCode.update(
        {
          ...dto,
          code: dto.code.toUpperCase(),
        },
        { transaction },
      );

      await transaction.commit();
      return promoCode;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const promoCode = await this.promoCodeRepository.findOne({
        where: { id },
        transaction,
      });
      if (!promoCode) throw new NotFoundException('Promo code not found');
      await promoCode.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async validate(tenantId: string, code: string, totalPurchase: number, productVariantId?: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      const promoCode = await this.promoCodeRepository.findOne({
        where: { 
          code: code.toUpperCase(),
          is_active: true
        },
        transaction,
      });

      if (!promoCode) {
        throw new BadRequestException('Kode promo tidak valid');
      }

      if (promoCode.product_variant_id && promoCode.product_variant_id !== productVariantId) {
        throw new BadRequestException('Kode promo tidak berlaku untuk produk ini');
      }

      const now = new Date();
      if (promoCode.start_date && now < new Date(promoCode.start_date)) {
        throw new BadRequestException('Promo belum dimulai');
      }
      if (promoCode.end_date && now > new Date(promoCode.end_date)) {
        throw new BadRequestException('Promo sudah berakhir');
      }

      if (promoCode.max_usage > 0 && promoCode.current_usage >= promoCode.max_usage) {
        throw new BadRequestException('Kuota promo sudah habis');
      }

      if (totalPurchase < promoCode.min_purchase) {
        throw new BadRequestException(`Minimal belanja Rp ${Number(promoCode.min_purchase).toLocaleString('id-ID')} untuk menggunakan kode ini`);
      }

      let discountAmount = 0;
      if (promoCode.type === 'FIXED') {
        discountAmount = promoCode.value;
      } else {
        discountAmount = (totalPurchase * promoCode.value) / 100;
      }

      // Ensure discount doesn't exceed total
      discountAmount = Math.min(discountAmount, totalPurchase);

      await transaction.commit();
      return {
        id: promoCode.id,
        code: promoCode.code,
        discount_amount: discountAmount,
        type: promoCode.type,
        value: promoCode.value,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
