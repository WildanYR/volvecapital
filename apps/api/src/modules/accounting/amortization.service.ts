import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Op } from 'sequelize';
import { ACCOUNT_USER_REPOSITORY, PRODUCT_VARIANT_REPOSITORY, TRANSACTION_REPOSITORY, COA_REPOSITORY } from 'src/constants/database.const';
import { AccountUser } from 'src/database/models/account-user.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction } from 'src/database/models/transaction.model';
import { Coa } from 'src/database/models/coa.model';
import { Account } from 'src/database/models/account.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AccountingService } from './accounting.service';

@Injectable()
export class AmortizationService {
  private readonly logger = new Logger(AmortizationService.name);

  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly accountingService: AccountingService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
    @Inject(COA_REPOSITORY)
    private readonly coaRepository: typeof Coa,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAmortization() {
    this.logger.log('Starting daily amortization cron job...');
    
    // In a real multi-tenant architecture, we would iterate over all tenants.
    // For VolveCapital, assuming 'master' tenant or iterating active tenants.
    const tenantId = 'master'; // Should ideally be dynamically fetched if multi-tenant
    
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      // Find all active account users (subscriptions) that are currently active
      // Meaning they have a related transaction and they haven't expired yet
      const activeSubscriptions = await this.accountUserRepository.findAll({
        where: {
          expired_at: {
            [Op.gt]: new Date(), // still active
          },
        },
        include: [
          {
            model: Account,
            required: true,
            include: [
              {
                model: ProductVariant,
                required: true,
                where: {
                  deferred_revenue_coa_id: { [Op.not]: null },
                  revenue_coa_id: { [Op.not]: null },
                }
              }
            ]
          }
        ],
        transaction: tx,
      });

      this.logger.log(`Found ${activeSubscriptions.length} active subscriptions for amortization.`);

      // Pre-fetch COAs to get codes
      const coas = await this.coaRepository.findAll({ transaction: tx });
      const coaMap = new Map(coas.map(c => [c.id, c.code]));

      for (const sub of activeSubscriptions) {
        const variant = sub.account?.product_variant;
        if (!variant) continue;

        // Note: For a more accurate system, we'd look up the exact TransactionItem that purchased this AccountUser.
        // For simplicity in this structure: we assume daily revenue = price / duration.
        // Assuming `duration` is in days. If it's in seconds/milliseconds, we'd adjust.
        // Let's assume price is the total price paid.
        const dailyRevenue = Math.floor(variant.price / (variant.duration || 1)); 
        
        // Let's assume cost is derived from variant's strike_price or we have a known capacity.
        // Since we don't have a rigid cost table here, we'll use a placeholder logic or if there's a strike_price.
        // For now, let's just recognize the revenue part and if inventory_coa_id is set, do COGS.
        
        const journalDate = new Date();
        const description = `Amortisasi harian otomatis untuk akun ${sub.account_id}`;

        // 1. Recognize Revenue
        if (variant.deferred_revenue_coa_id && variant.revenue_coa_id) {
          const deferredCode = coaMap.get(variant.deferred_revenue_coa_id as string);
          const revCode = coaMap.get(variant.revenue_coa_id as string);
          
          if (deferredCode && revCode) {
            await this.accountingService.createJournalEntry(tenantId, {
              date: journalDate,
              reference: `AMRT-REV-${sub.id}-${journalDate.getTime()}`,
              description: `${description} (Pendapatan)`,
              source: 'SYSTEM_AMORTIZATION',
              lines: [
                { coa_code: deferredCode, debit: dailyRevenue, credit: 0 },
                { coa_code: revCode, debit: 0, credit: dailyRevenue },
              ],
            }, tx as any);
          }
        }

        // 2. Recognize COGS
        // We need the daily COGS amount. If not explicitly stored, we might need a daily_cogs field.
        // For now, let's assume it's calculated or we skip if we don't have exact numbers in variant.
        // (In production, you'd add a `cogs_per_day` to product_variant).
        const dailyCogs = Math.floor((variant.strike_price || 0) / (variant.duration || 1));
        if (variant.inventory_coa_id && variant.expense_coa_id && dailyCogs > 0) {
          const expCode = coaMap.get(variant.expense_coa_id as string);
          const invCode = coaMap.get(variant.inventory_coa_id as string);
          
          if (expCode && invCode) {
            await this.accountingService.createJournalEntry(tenantId, {
              date: journalDate,
              reference: `AMRT-COGS-${sub.id}-${journalDate.getTime()}`,
              description: `${description} (HPP)`,
              source: 'SYSTEM_AMORTIZATION',
              lines: [
                { coa_code: expCode, debit: dailyCogs, credit: 0 },
                { coa_code: invCode, debit: 0, credit: dailyCogs },
              ],
            }, tx as any);
          }
        }
      }

      await tx.commit();
      this.logger.log('Daily amortization cron job completed successfully.');
    } catch (error) {
      await tx.rollback();
      this.logger.error('Failed to run daily amortization', error);
    }
  }
}
