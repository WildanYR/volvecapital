import { Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import {
  PEAK_HOUR_STATISTICS_REPOSITORY,
  PLATFORM_STATISTICS_REPOSITORY,
  PRODUCT_SALES_STATISTICS_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  REVENUE_STATISTICS_REPOSITORY,
} from 'src/constants/database.const';
import { PeakHourStatistics } from 'src/database/models/peak-hour-statistics.model';
import { PlatformStatistics } from 'src/database/models/platform-statistics.model';
import { ProductSalesStatistics } from 'src/database/models/product-sales-statistics.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { RevenueStatistics } from 'src/database/models/revenue-statistics.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { DateConverterProvider } from '../utility/date-converter.provider';

@Injectable()
export class StatisticService {
  constructor(
    private readonly dateConverterProvider: DateConverterProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(REVENUE_STATISTICS_REPOSITORY)
    private readonly revenueStatisticRepository: typeof RevenueStatistics,
    @Inject(PRODUCT_SALES_STATISTICS_REPOSITORY)
    private readonly productSatisticRepository: typeof ProductSalesStatistics,
    @Inject(PLATFORM_STATISTICS_REPOSITORY)
    private readonly platformStatisticRepository: typeof PlatformStatistics,
    @Inject(PEAK_HOUR_STATISTICS_REPOSITORY)
    private readonly peakHourStatisticRepository: typeof PeakHourStatistics,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  async getAllStatistic(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const startOfMonth = this.dateConverterProvider.getStartOfTheMonthDate();
      const endOfMonth = this.dateConverterProvider.getEndOfTheMonthDate();

      const revenueStatistic = await this.revenueStatisticRepository.findAll({
        where: { date: { [Op.between]: [startOfMonth, endOfMonth] } },
        order: [['date', 'DESC']],
        transaction,
      });

      const revenueTodaySum = revenueStatistic.find(
        item => item.dataValues.type === 'daily',
      );
      const revenueMonthSum = revenueStatistic.find(
        item => item.dataValues.type === 'monthly',
      );
      const revenueDaily = revenueStatistic
        .filter(item => item.dataValues.type === 'daily')
        .toReversed();

      const productStatistic = await this.productSatisticRepository.findAll({
        where: { date: { [Op.between]: [startOfMonth, endOfMonth] } },
        order: [['date', 'DESC']],
        transaction,
      });
      const productVariantIds = [
        ...new Set(
          productStatistic.map(item => item.dataValues.product_variant_id),
        ),
      ];
      const productVariants = await this.productVariantRepository.findAll({
        where: { id: productVariantIds },
        attributes: ['id', 'name'],
        include: [
          { model: Product, as: 'product', attributes: ['id', 'name'] },
        ],
        transaction,
      });
      const productStatisticData: {
        date: string;
        type: string;
        product_variant_id: string;
        items_sold: number;
        product_variant: {
          id: string;
          name: string;
          product: { id: string; name: string };
        };
        created_at: Date;
        updated_at: Date;
      }[] = [];
      for (const ps of productStatistic) {
        for (const pv of productVariants) {
          if (ps.dataValues.product_variant_id === pv.id) {
            productStatisticData.push({
              date: ps.dataValues.date,
              type: ps.dataValues.type,
              product_variant_id: ps.dataValues.product_variant_id,
              items_sold: ps.dataValues.items_sold,
              product_variant: {
                id: pv.id,
                name: pv.dataValues.name,
                product: {
                  id: pv.dataValues.product.id,
                  name: pv.dataValues.product.name,
                },
              },
              created_at: ps.dataValues.created_at,
              updated_at: ps.dataValues.updated_at,
            });
          }
        }
      }

      const platformStatistic = await this.platformStatisticRepository.findAll({
        where: { date: { [Op.between]: [startOfMonth, endOfMonth] } },
        transaction,
      });
      const peakHourStatistic = await this.peakHourStatisticRepository.findAll({
        where: { date: { [Op.between]: [startOfMonth, endOfMonth] } },
        transaction,
      });
      await transaction.commit();
      return {
        revenue: {
          today: revenueTodaySum,
          month: revenueMonthSum,
          daily: revenueDaily,
        },
        product: productStatisticData,
        platform: platformStatistic,
        peakHour: peakHourStatistic,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
