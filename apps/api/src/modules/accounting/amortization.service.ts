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
import { AccountProfile } from 'src/database/models/account-profile.model';
import { Email } from 'src/database/models/email.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AccountingService } from './accounting.service';

@Injectable()
export class AmortizationService {
  private readonly logger = new Logger(AmortizationService.name);
  private isProcessingAmortization = false;
  private lastRunDateStr: string | null = null;

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
  async handleDailyAmortization(isManual = false) {
    const journalDate = new Date();
    const dateStr = journalDate.toISOString().split('T')[0];

    if (this.isProcessingAmortization) {
      this.logger.log('Amortization is already running. Skipping...');
      if (isManual) return { success: false, message: 'Proses amortisasi sedang berjalan, mohon tunggu.' };
      return;
    }

    if (this.lastRunDateStr === dateStr) {
      this.logger.log(`Amortization already ran today (${dateStr}). Skipping...`);
      if (isManual) return { success: false, alreadyRun: true, message: `Amortisasi untuk tanggal ${dateStr} sudah dilakukan hari ini.` };
      return;
    }

    this.isProcessingAmortization = true;
    this.logger.log('Starting daily amortization cron job...');
    
    try {
      const schemas = await this.postgresProvider.rawQuery(
        `SELECT nspname AS id FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema' AND nspname != 'public' AND nspname != 'master'`,
        { type: (this.postgresProvider as any).sequelize.QueryTypes?.SELECT || 'SELECT' }
      ) as { id: string }[];

      for (const tenantRow of schemas) {
        const tenantId = tenantRow.id;
        this.logger.log(`Processing amortization for tenant: ${tenantId}`);
        
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
              created_at: {
                [Op.gte]: new Date('2026-06-26T00:00:00Z'), // Only amortize transactions since accounting module started
              }
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
                  },
                  {
                    model: Email,
                    required: false,
                  },
                  {
                    model: AccountProfile,
                    required: false,
                  }
                ]
              },
              {
                model: TransactionItem,
                required: false,
                include: [
                  {
                    model: Transaction,
                    required: false,
                    include: [
                      {
                        model: TransactionItem,
                        required: false,
                      }
                    ]
                  }
                ]
              }
            ],
            transaction: tx,
          });

          this.logger.log(`Found ${activeSubscriptions.length} active subscriptions for amortization in tenant ${tenantId}.`);

          // Pre-fetch COAs to get codes
          const coas = await this.coaRepository.findAll({ transaction: tx });
          const coaMap = new Map(coas.map(c => [c.id, c.code]));

          const journalDate = new Date();
          const dateStr = journalDate.toISOString().split('T')[0];
          
          // Get all existing amortization journals for today to prevent duplicates
          const existingRefsResult = await this.postgresProvider.rawQuery(
            `SELECT reference_number FROM ${tenantId}.journal_entry WHERE reference_number LIKE 'AMRT-%-${dateStr}'`,
            { type: (this.postgresProvider as any).sequelize?.QueryTypes?.SELECT || 'SELECT', transaction: tx }
          ) as { reference_number: string }[];
          const existingRefs = new Set(existingRefsResult.map(r => r.reference_number));

          this.logger.log(`Existing refs found for today (${dateStr}): ${existingRefs.size}`);
          
          // Group by account to process COGS and Loss efficiently
          const accountMap = new Map<string, any>();
          
          for (const sub of activeSubscriptions) {
             const accountId = sub.account_id;
             if (!accountMap.has(accountId)) {
                 const account = sub.account;
                 const profiles = account.profile || [];
                 // Calculate max_users where allow_generate is true
                 const totalMaxUsers = profiles
                    .filter(p => p.allow_generate)
                    .reduce((sum, p) => sum + (p.max_user || 1), 0);
                 
                 // Account duration in days
                 const accDurationMs = account.subscription_expiry.getTime() - ((account as any).created_at || (account as any).createdAt).getTime();
                 const accDurationDays = Math.max(1, Math.round(accDurationMs / (1000 * 60 * 60 * 24)));
                 const dailyAccountCost = Math.floor((account.capital_price || 0) / accDurationDays);
                 const dailyCogsPerUser = totalMaxUsers > 0 ? Math.floor(dailyAccountCost / totalMaxUsers) : 0;

                 accountMap.set(accountId, {
                     account,
                     totalMaxUsers,
                     dailyAccountCost,
                     dailyCogsPerUser,
                     subs: [],
                     cogsJournalsCreated: 0
                 });
             }
             accountMap.get(accountId).subs.push(sub);
          }

          for (const [accountId, accData] of accountMap.entries()) {
              const accountEmail = accData.account.email?.email || accountId;
              const variant = accData.account.product_variant;
              
              for (const sub of accData.subs) {
                 const durationMs = sub.expired_at.getTime() - ((sub as any).created_at || (sub as any).createdAt).getTime();
                 const durationInDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
                 
                 let dailyRevenue = 0;
                 if (sub.transaction_item && sub.transaction_item.transaction) {
                     const transaction = sub.transaction_item.transaction;
                     const totalItems = transaction.items?.length || 1;
                     const itemPrice = Math.floor((transaction.total_price || 0) / totalItems);
                     dailyRevenue = Math.floor(itemPrice / durationInDays);
                 } else {
                     // Fallback to variant price if no transaction found
                     dailyRevenue = Math.floor((variant.price || 0) / durationInDays);
                 }

                 const description = `Amortisasi harian otomatis: ${sub.name} (${accountEmail})`;
                 const revRef = `AMRT-REV-${sub.id}-${dateStr}`;
                 const cogsRef = `AMRT-COGS-${sub.id}-${dateStr}`;
                 
                 // 1. Recognize Revenue
                 if (dailyRevenue > 0 && variant.deferred_revenue_coa_id && variant.revenue_coa_id && !existingRefs.has(revRef)) {
                   const deferredCode = coaMap.get(variant.deferred_revenue_coa_id as string);
                   const revCode = coaMap.get(variant.revenue_coa_id as string);
                   
                   if (deferredCode && revCode) {
                     await this.accountingService.createJournalEntry(tenantId, {
                       date: journalDate,
                       reference: revRef,
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
                 if (accData.dailyCogsPerUser > 0 && variant.inventory_coa_id && variant.expense_coa_id && !existingRefs.has(cogsRef)) {
                   const expCode = coaMap.get(variant.expense_coa_id as string);
                   const invCode = coaMap.get(variant.inventory_coa_id as string);
                   
                   if (expCode && invCode) {
                     await this.accountingService.createJournalEntry(tenantId, {
                       date: journalDate,
                       reference: cogsRef,
                       description: `${description} (HPP)`,
                       source: 'SYSTEM_AMORTIZATION',
                       lines: [
                         { coa_code: expCode, debit: accData.dailyCogsPerUser, credit: 0 },
                         { coa_code: invCode, debit: 0, credit: accData.dailyCogsPerUser },
                       ],
                     }, tx as any);
                     accData.cogsJournalsCreated++;
                   }
                 }
              }

              // 3. Recognize Loss for Unsold Slots
              const unsoldCost = accData.dailyAccountCost - (accData.cogsJournalsCreated * accData.dailyCogsPerUser);
              if (unsoldCost > 0 && variant.inventory_coa_id && variant.expense_coa_id) {
                 const lossRef = `AMRT-LOSS-${accountId}-${dateStr}`;
                 if (!existingRefs.has(lossRef)) {
                    const expCode = coaMap.get(variant.expense_coa_id as string);
                    const invCode = coaMap.get(variant.inventory_coa_id as string);
                    
                    if (expCode && invCode) {
                      await this.accountingService.createJournalEntry(tenantId, {
                        date: journalDate,
                        reference: lossRef,
                        description: `Kerugian slot kosong harian: Akun ${accountEmail}`,
                        source: 'SYSTEM_AMORTIZATION',
                        lines: [
                          { coa_code: expCode, debit: unsoldCost, credit: 0 },
                          { coa_code: invCode, debit: 0, credit: unsoldCost },
                        ],
                      }, tx as any);
                    }
                 }
              }
          }

          await tx.commit();
          this.logger.log(`Completed amortization for tenant ${tenantId}.`);
        } catch (error) {
          await tx.rollback();
          this.logger.error(`Failed to run daily amortization for tenant ${tenantId}`, error);
        }
      }
      this.lastRunDateStr = dateStr;
      this.logger.log('Daily amortization cron job completed successfully for all tenants.');
      if (isManual) return { success: true, message: `Amortisasi berhasil diproses untuk tanggal ${dateStr}.` };
    } catch (error) {
      this.logger.error('Failed to fetch tenants for amortization', error);
      if (isManual) return { success: false, message: 'Gagal memproses amortisasi.' };
    } finally {
      this.isProcessingAmortization = false;
    }
  }
}
