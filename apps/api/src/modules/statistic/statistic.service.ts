import { Injectable } from '@nestjs/common';
import { QueryTypes } from 'sequelize';
import { PostgresProvider } from 'src/database/postgres.provider';

export type StatisticFilterType =
  | 'realtime'
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'last_30_days'
  | 'custom_day'
  | 'custom_week'
  | 'custom_month'
  | 'custom_year';

export type ChartGranularity = 'hour' | 'day' | 'month';

export interface StatisticParams {
  filter?: StatisticFilterType;
  date?: string;        // YYYY-MM-DD  — for custom_day
  start_date?: string;  // YYYY-MM-DD  — for custom_week start
  end_date?: string;    // YYYY-MM-DD  — for custom_week end
  year?: string;        // YYYY        — for custom_year / custom_month
  month?: string;       // MM (1-12)   — for custom_month
}

interface DateRange {
  start: Date;
  end: Date;
  prevStart: Date | null;
  prevEnd: Date | null;
  granularity: ChartGranularity;
}

@Injectable()
export class StatisticService {
  constructor(private readonly postgresProvider: PostgresProvider) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Date-range resolver
  // ──────────────────────────────────────────────────────────────────────────
  private resolveDateRange(params: StatisticParams): DateRange {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const filter: StatisticFilterType = params.filter ?? 'today';

    switch (filter) {
      /* ── realtime / today ─────────────────────────────────────── */
      case 'realtime':
      case 'today': {
        const pStart = new Date(todayStart);
        pStart.setDate(pStart.getDate() - 1);
        const pEnd = new Date(todayStart);
        pEnd.setMilliseconds(-1);
        return { start: todayStart, end: now, prevStart: pStart, prevEnd: pEnd, granularity: 'hour' };
      }

      /* ── yesterday ────────────────────────────────────────────── */
      case 'yesterday': {
        const ys = new Date(todayStart);
        ys.setDate(ys.getDate() - 1);
        const ye = new Date(todayStart);
        ye.setMilliseconds(-1);

        const pStart = new Date(ys);
        pStart.setDate(pStart.getDate() - 1);
        const pEnd = new Date(ys);
        pEnd.setMilliseconds(-1);
        
        return { start: ys, end: ye, prevStart: pStart, prevEnd: pEnd, granularity: 'hour' };
      }

      /* ── last 7 days ──────────────────────────────────────────── */
      case 'last_7_days': {
        const s = new Date(todayStart);
        s.setDate(s.getDate() - 7);
        
        const pStart = new Date(s);
        pStart.setDate(pStart.getDate() - 7);
        const pEnd = new Date(s);
        pEnd.setMilliseconds(-1);

        return { start: s, end: now, prevStart: pStart, prevEnd: pEnd, granularity: 'day' };
      }

      /* ── last 30 days ─────────────────────────────────────────── */
      case 'last_30_days': {
        const s = new Date(todayStart);
        s.setDate(s.getDate() - 30);
        
        const pStart = new Date(s);
        pStart.setDate(pStart.getDate() - 30);
        const pEnd = new Date(s);
        pEnd.setMilliseconds(-1);

        return { start: s, end: now, prevStart: pStart, prevEnd: pEnd, granularity: 'day' };
      }

      /* ── specific day ─────────────────────────────────────────── */
      case 'custom_day': {
        const d = params.date ? new Date(params.date) : todayStart;
        const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        
        const pStart = new Date(s);
        pStart.setDate(pStart.getDate() - 1);
        const pEnd = new Date(pStart);
        pEnd.setHours(23, 59, 59, 999);

        return { start: s, end: e, prevStart: pStart, prevEnd: pEnd, granularity: 'hour' };
      }

      /* ── date-range (week or arbitrary range) ─────────────────── */
      case 'custom_week': {
        const s = params.start_date ? new Date(params.start_date) : todayStart;
        const e = params.end_date ? new Date(params.end_date) : now;
        e.setHours(23, 59, 59, 999);
        
        const diffDays = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
        const pStart = new Date(s);
        pStart.setDate(pStart.getDate() - diffDays);
        const pEnd = new Date(s);
        pEnd.setMilliseconds(-1);

        return { start: s, end: e, prevStart: pStart, prevEnd: pEnd, granularity: 'day' };
      }

      /* ── specific month ───────────────────────────────────────── */
      case 'custom_month': {
        const yr = params.year ? parseInt(params.year, 10) : now.getFullYear();
        const mo = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();
        const s = new Date(yr, mo, 1);
        const e = new Date(yr, mo + 1, 0, 23, 59, 59, 999);
        
        const pStart = new Date(yr, mo - 1, 1);
        const pEnd = new Date(yr, mo, 0, 23, 59, 59, 999);

        return { start: s, end: e, prevStart: pStart, prevEnd: pEnd, granularity: 'day' };
      }

      /* ── specific year ────────────────────────────────────────── */
      case 'custom_year': {
        const yr = params.year ? parseInt(params.year, 10) : now.getFullYear();
        const s = new Date(yr, 0, 1);
        const e = new Date(yr, 11, 31, 23, 59, 59, 999);
        
        const pStart = new Date(yr - 1, 0, 1);
        const pEnd = new Date(yr - 1, 11, 31, 23, 59, 59, 999);

        return { start: s, end: e, prevStart: pStart, prevEnd: pEnd, granularity: 'month' };
      }

      default:
        return { start: todayStart, end: now, prevStart: null, prevEnd: null, granularity: 'hour' };
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Main entry-point
  // ──────────────────────────────────────────────────────────────────────────
  async getStatistic(tenantId: string, params: StatisticParams) {
    const tx = await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const { start, end, prevStart, prevEnd, granularity } = this.resolveDateRange(params);

      const repl = {
        start: start.toISOString(),
        end:   end.toISOString(),
        granularity,
      };

      // ── Summary card ────────────────────────────────────────────
      const summaryRaw = await this.postgresProvider.rawQuery(
        `SELECT
           COALESCE(SUM(t.total_price), 0)    AS total_revenue,
           COALESCE(SUM(a.capital_price), 0)  AS total_capital_price,
           COALESCE(SUM(t.total_price), 0)
             - COALESCE(SUM(a.capital_price), 0) AS gross_profit,
           COUNT(DISTINCT t.id)               AS transaction_count
         FROM "transaction" t
         LEFT JOIN "transaction_item" ti ON ti.transaction_id = t.id
         LEFT JOIN "account_user"     au ON au.id = ti.account_user_id
         LEFT JOIN "account"           a ON  a.id = au.account_id
         WHERE t.created_at >= :start
           AND t.created_at <= :end`,
        { type: QueryTypes.SELECT, transaction: tx, replacements: repl },
      ) as any[];

      const summary = summaryRaw[0] ?? {};

      // ── Previous Summary card for % comparison ──────────────────
      let prevSummary: any = {};
      if (prevStart && prevEnd) {
        const prevRepl = {
          start: prevStart.toISOString(),
          end:   prevEnd.toISOString(),
        };
        const prevSummaryRaw = await this.postgresProvider.rawQuery(
          `SELECT
             COALESCE(SUM(t.total_price), 0)    AS total_revenue,
             COALESCE(SUM(a.capital_price), 0)  AS total_capital_price,
             COALESCE(SUM(t.total_price), 0)
               - COALESCE(SUM(a.capital_price), 0) AS gross_profit,
             COUNT(DISTINCT t.id)               AS transaction_count
           FROM "transaction" t
           LEFT JOIN "transaction_item" ti ON ti.transaction_id = t.id
           LEFT JOIN "account_user"     au ON au.id = ti.account_user_id
           LEFT JOIN "account"           a ON  a.id = au.account_id
           WHERE t.created_at >= :start
             AND t.created_at <= :end`,
          { type: QueryTypes.SELECT, transaction: tx, replacements: prevRepl },
        ) as any[];
        prevSummary = prevSummaryRaw[0] ?? {};
      }

      // ── Revenue chart (bucketed by granularity) ─────────────────
      const revenueChart = await this.postgresProvider.rawQuery(
        `SELECT
           date_trunc(:granularity, t.created_at) AS bucket,
           COALESCE(SUM(t.total_price), 0)        AS total_revenue,
           COUNT(DISTINCT t.id)                   AS transaction_count
         FROM "transaction" t
         WHERE t.created_at >= :start
           AND t.created_at <= :end
         GROUP BY bucket
         ORDER BY bucket ASC`,
        { type: QueryTypes.SELECT, transaction: tx, replacements: repl },
      ) as any[];

      // ── Peak-hour distribution ───────────────────────────────────
      const peakHour = await this.postgresProvider.rawQuery(
        `SELECT
           EXTRACT(hour FROM t.created_at)::INTEGER AS hour,
           COUNT(DISTINCT t.id)                     AS transaction_count
         FROM "transaction" t
         WHERE t.created_at >= :start
           AND t.created_at <= :end
         GROUP BY hour
         ORDER BY hour ASC`,
        { type: QueryTypes.SELECT, transaction: tx, replacements: repl },
      ) as any[];

      // ── Platform breakdown ───────────────────────────────────────
      const platform = await this.postgresProvider.rawQuery(
        `SELECT
           t.platform,
           COUNT(DISTINCT t.id)::INTEGER AS transaction_count,
           COALESCE(SUM(t.total_price), 0) AS total_revenue
         FROM "transaction" t
         WHERE t.created_at >= :start
           AND t.created_at <= :end
         GROUP BY t.platform
         ORDER BY transaction_count DESC`,
        { type: QueryTypes.SELECT, transaction: tx, replacements: repl },
      ) as any[];

      // ── Top products ─────────────────────────────────────────────
      const products = await this.postgresProvider.rawQuery(
        `SELECT
           pv.id          AS product_variant_id,
           p.name         AS product_name,
           pv.name        AS variant_name,
           COUNT(ti.id)::INTEGER AS items_sold
         FROM "transaction_item" ti
         JOIN "transaction"    t   ON t.id   = ti.transaction_id
         JOIN "account_user"   au  ON au.id  = ti.account_user_id
         JOIN "account"        acc ON acc.id = au.account_id
         JOIN "product_variant" pv ON pv.id  = acc.product_variant_id
         JOIN "product"         p  ON p.id   = pv.product_id
         WHERE t.created_at >= :start
           AND t.created_at <= :end
         GROUP BY pv.id, p.name, pv.name
         ORDER BY items_sold DESC
         LIMIT 10`,
        { type: QueryTypes.SELECT, transaction: tx, replacements: repl },
      ) as any[];

      await tx.commit();

      // ── Format label for X-axis based on granularity ─────────────
      const fmtBucket = (raw: string) => {
        const d = new Date(raw);
        if (granularity === 'hour')  return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
        if (granularity === 'month') return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        // day: YYYY-MM-DD
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      };

      const calcPercentage = (current: number, prev: number) => {
        if (prev === 0 && current === 0) return 0;
        if (prev === 0) return 100;
        return ((current - prev) / Math.abs(prev)) * 100;
      };

      const curRevenue = Number(summary.total_revenue ?? 0);
      const prevRevenue = Number(prevSummary.total_revenue ?? 0);
      const curProfit = Number(summary.gross_profit ?? 0);
      const prevProfit = Number(prevSummary.gross_profit ?? 0);
      const curTrx = Number(summary.transaction_count ?? 0);
      const prevTrx = Number(prevSummary.transaction_count ?? 0);

      return {
        summary: {
          total_revenue:        curRevenue,
          revenue_percentage:   calcPercentage(curRevenue, prevRevenue),
          total_capital_price:  Number(summary.total_capital_price  ?? 0),
          gross_profit:         curProfit,
          profit_percentage:    calcPercentage(curProfit, prevProfit),
          transaction_count:    curTrx,
          transaction_percentage: calcPercentage(curTrx, prevTrx),
        },
        charts: {
          revenue: revenueChart.map(r => ({
            bucket:            fmtBucket(r.bucket),
            total_revenue:     Number(r.total_revenue),
            transaction_count: Number(r.transaction_count),
          })),
          peakHour: peakHour.map(p => ({
            hour:              Number(p.hour),
            transaction_count: Number(p.transaction_count),
          })),
          platform: platform.map(p => ({
            platform:          p.platform as string,
            transaction_count: Number(p.transaction_count),
            total_revenue:     Number(p.total_revenue),
          })),
          products: products.map(p => ({
            product_variant_id: String(p.product_variant_id),
            product_name:       p.product_name as string,
            variant_name:       p.variant_name as string,
            items_sold:         Number(p.items_sold),
          })),
        },
        meta: {
          filter:      params.filter ?? 'today',
          granularity,
          start:       start.toISOString(),
          end:         end.toISOString(),
        },
      };
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }
}
