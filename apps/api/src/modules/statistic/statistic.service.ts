import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class StatisticService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
  ) {}

  private getRangeDetails(range: string): { startDate: Date; isMonthly: boolean } {
    const now = new Date();
    const startDate = new Date();
    let isMonthly = false;

    switch (range) {
      case 'week': {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
      case '3months': {
        startDate.setMonth(now.getMonth() - 3);
        startDate.setHours(0, 0, 0, 0);
        isMonthly = true;
        break;
      }
      case '1year': {
        startDate.setFullYear(now.getFullYear() - 1);
        startDate.setHours(0, 0, 0, 0);
        isMonthly = true;
        break;
      }
      case 'month':
      default: {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        break;
      }
    }
    return { startDate, isMonthly };
  }

  async getAllStatistic(tenantId: string, range: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const { startDate, isMonthly } = this.getRangeDetails(range);

      // 1. Query Period Totals
      const periodTotalSql = isMonthly
        ? `
          WITH rev AS (
            SELECT COALESCE(SUM(revenue), 0) AS total_revenue, COALESCE(SUM(total_transaction), 0) AS total_transaction
            FROM monthly_platform_stats
            WHERE bucket_month >= :startDate
          ),
          exp AS (
            SELECT COALESCE(SUM(total_expense_amount), 0) AS total_expense
            FROM monthly_expense_stats
            WHERE bucket_month >= :startDate
          )
          SELECT 
            (total_revenue - total_expense)::BIGINT AS net_income,
            total_expense::BIGINT AS expense,
            total_transaction::BIGINT AS transaction_count
          FROM rev, exp;
        `
        : `
          WITH rev AS (
            SELECT COALESCE(SUM(revenue), 0) AS total_revenue, COALESCE(SUM(total_transaction), 0) AS total_transaction
            FROM daily_platform_stats
            WHERE bucket >= :startDate
          ),
          exp AS (
            SELECT COALESCE(SUM(total_expense_amount), 0) AS total_expense
            FROM daily_expense_stats
            WHERE bucket >= :startDate
          )
          SELECT 
            (total_revenue - total_expense)::BIGINT AS net_income,
            total_expense::BIGINT AS expense,
            total_transaction::BIGINT AS transaction_count
          FROM rev, exp;
        `;

      const rawPeriodTotal = await this.postgresProvider.rawQuery(periodTotalSql, {
        replacements: { startDate },
        type: QueryTypes.SELECT,
        transaction,
      }) as any[];

      const periodTotal = rawPeriodTotal[0] || { net_income: 0, expense: 0, transaction_count: 0 };

      // 2. Query Time-Series Breakdown for Chart
      const breakdownSql = isMonthly
        ? `
          WITH rev AS (
            SELECT 
              bucket_month,
              SUM(revenue) AS total_revenue,
              SUM(total_transaction) AS total_transaction
            FROM monthly_platform_stats
            WHERE bucket_month >= :startDate
            GROUP BY bucket_month
          ),
          exp AS (
            SELECT 
              bucket_month,
              SUM(total_expense_amount) AS total_expense
            FROM monthly_expense_stats
            WHERE bucket_month >= :startDate
            GROUP BY bucket_month
          )
          SELECT 
            to_char(COALESCE(rev.bucket_month, exp.bucket_month), 'YYYY-MM') AS date,
            (COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expense, 0))::BIGINT AS net_income,
            COALESCE(exp.total_expense, 0)::BIGINT AS expense,
            COALESCE(rev.total_transaction, 0)::BIGINT AS transaction_count,
            COALESCE(rev.bucket_month, exp.bucket_month) AS created_at
          FROM rev
          FULL OUTER JOIN exp ON rev.bucket_month = exp.bucket_month
          ORDER BY COALESCE(rev.bucket_month, exp.bucket_month) ASC;
        `
        : `
          WITH rev AS (
            SELECT 
              bucket,
              SUM(revenue) AS total_revenue,
              SUM(total_transaction) AS total_transaction
            FROM daily_platform_stats
            WHERE bucket >= :startDate
            GROUP BY bucket
          ),
          exp AS (
            SELECT 
              bucket,
              SUM(total_expense_amount) AS total_expense
            FROM daily_expense_stats
            WHERE bucket >= :startDate
            GROUP BY bucket
          )
          SELECT 
            COALESCE(rev.bucket, exp.bucket)::date AS date,
            (COALESCE(rev.total_revenue, 0) - COALESCE(exp.total_expense, 0))::BIGINT AS net_income,
            COALESCE(exp.total_expense, 0)::BIGINT AS expense,
            COALESCE(rev.total_transaction, 0)::BIGINT AS transaction_count,
            COALESCE(rev.bucket, exp.bucket) AS created_at
          FROM rev
          FULL OUTER JOIN exp ON rev.bucket = exp.bucket
          ORDER BY date ASC;
        `;

      const rawBreakdown = await this.postgresProvider.rawQuery(breakdownSql, {
        replacements: { startDate },
        type: QueryTypes.SELECT,
        transaction,
      }) as any[];

      // 3. Query Product Sales Stats
      const productSql = isMonthly
        ? `
          SELECT 
            stats.product_variant_id,
            SUM(stats.total_transaction)::BIGINT AS items_sold,
            pv.name AS product_variant_name,
            p.id AS product_id,
            p.name AS product_name
          FROM monthly_product_sales_stats stats
          JOIN product_variant pv ON stats.product_variant_id = pv.id
          JOIN product p ON stats.product_id = p.id
          WHERE stats.bucket_month >= :startDate
          GROUP BY stats.product_variant_id, pv.name, p.id, p.name
          ORDER BY items_sold DESC;
        `
        : `
          SELECT 
            stats.product_variant_id,
            SUM(stats.total_transaction)::BIGINT AS items_sold,
            pv.name AS product_variant_name,
            p.id AS product_id,
            p.name AS product_name
          FROM daily_product_sales_stats stats
          JOIN product_variant pv ON stats.product_variant_id = pv.id
          JOIN product p ON stats.product_id = p.id
          WHERE stats.bucket >= :startDate
          GROUP BY stats.product_variant_id, pv.name, p.id, p.name
          ORDER BY items_sold DESC;
        `;

      const rawProducts = await this.postgresProvider.rawQuery(productSql, {
        replacements: { startDate },
        type: QueryTypes.SELECT,
        transaction,
      }) as any[];

      // 4. Query Platform Stats
      const platformSql = isMonthly
        ? `
          SELECT 
            platform,
            SUM(total_transaction)::BIGINT AS transaction_count
          FROM monthly_platform_stats
          WHERE bucket_month >= :startDate
          GROUP BY platform
          ORDER BY transaction_count DESC;
        `
        : `
          SELECT 
            platform,
            SUM(total_transaction)::BIGINT AS transaction_count
          FROM daily_platform_stats
          WHERE bucket >= :startDate
          GROUP BY platform
          ORDER BY transaction_count DESC;
        `;

      const rawPlatforms = await this.postgresProvider.rawQuery(platformSql, {
        replacements: { startDate },
        type: QueryTypes.SELECT,
        transaction,
      }) as any[];

      // 5. Query Peak Hour Stats
      const peakHourSql = `
        SELECT 
          EXTRACT(HOUR FROM (bucket AT TIME ZONE 'Asia/Jakarta'))::SMALLINT AS hour,
          SUM(total_transaction)::BIGINT AS transaction_count
        FROM peak_hour_stats
        WHERE bucket >= :startDate
        GROUP BY hour
        ORDER BY hour ASC;
      `;

      const rawPeakHours = await this.postgresProvider.rawQuery(peakHourSql, {
        replacements: { startDate },
        type: QueryTypes.SELECT,
        transaction,
      }) as any[];

      await transaction.commit();

      return {
        revenue: {
          period: {
            net_income: Number(periodTotal.net_income),
            expense: Number(periodTotal.expense),
            transaction_count: Number(periodTotal.transaction_count),
            created_at: new Date(),
            updated_at: new Date(),
          },
          daily: rawBreakdown.map((b: any) => ({
            date: b.date,
            net_income: Number(b.net_income),
            expense: Number(b.expense),
            transaction_count: Number(b.transaction_count),
            created_at: new Date(b.created_at),
            updated_at: new Date(b.created_at),
          })),
        },
        product: rawProducts.map((p: any) => ({
          product_variant_id: p.product_variant_id,
          items_sold: Number(p.items_sold),
          product_variant: {
            id: p.product_variant_id,
            name: p.product_variant_name,
            product: {
              id: p.product_id,
              name: p.product_name,
            },
          },
        })),
        platform: rawPlatforms.map((pl: any) => ({
          platform: pl.platform,
          transaction_count: Number(pl.transaction_count),
        })),
        peakHour: rawPeakHours.map((ph: any) => ({
          hour: Number(ph.hour),
          transaction_count: Number(ph.transaction_count),
        })),
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
