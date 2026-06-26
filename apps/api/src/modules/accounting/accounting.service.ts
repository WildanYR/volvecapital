import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Transaction as SequelizeTransaction, Op, where, fn, col } from 'sequelize';
import {
  COA_REPOSITORY,
  JOURNAL_ENTRY_REPOSITORY,
  JOURNAL_LINE_REPOSITORY,
  ACCOUNTING_PERIOD_REPOSITORY,
  PLATFORM_ACCOUNTING_SETTING_REPOSITORY,
  JOURNAL_TEMPLATE_REPOSITORY,
  JOURNAL_TEMPLATE_ITEM_REPOSITORY,
} from 'src/constants/database.const';
import { Coa } from 'src/database/models/coa.model';
import { JournalEntry } from 'src/database/models/journal-entry.model';
import { JournalLine } from 'src/database/models/journal-line.model';
import { AccountingPeriod } from 'src/database/models/accounting-period.model';
import { PlatformAccountingSetting } from 'src/database/models/platform-accounting-setting.model';
import { JournalTemplate } from 'src/database/models/journal-template.model';
import { JournalTemplateItem } from 'src/database/models/journal-template-item.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { Transaction as TransactionModel } from 'src/database/models/transaction.model';
import { CreateJournalTemplateDto } from './dto/create-journal-template.dto';
import { UpdateJournalTemplateDto } from './dto/update-journal-template.dto';

export interface CreateJournalEntryDto {
  date: Date;
  reference?: string;
  description: string;
  source?: string;
  lines: {
    coa_code: string;
    debit: number;
    credit: number;
    memo?: string;
  }[];
}

@Injectable()
export class AccountingService {
  private readonly logger = new Logger('AccountingService');

  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(COA_REPOSITORY) private readonly coaRepository: typeof Coa,
    @Inject(JOURNAL_ENTRY_REPOSITORY) private readonly journalEntryRepository: typeof JournalEntry,
    @Inject(JOURNAL_LINE_REPOSITORY) private readonly journalLineRepository: typeof JournalLine,
    @Inject(ACCOUNTING_PERIOD_REPOSITORY) private readonly accountingPeriodRepository: typeof AccountingPeriod,
    @Inject(PLATFORM_ACCOUNTING_SETTING_REPOSITORY) private readonly platformAccountingSettingRepository: typeof PlatformAccountingSetting,
    @Inject(JOURNAL_TEMPLATE_REPOSITORY) private readonly journalTemplateRepository: typeof JournalTemplate,
    @Inject(JOURNAL_TEMPLATE_ITEM_REPOSITORY) private readonly journalTemplateItemRepository: typeof JournalTemplateItem,
  ) {}

  async getCoaList(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const list = await this.coaRepository.findAll({ 
        order: [['code', 'ASC']],
        transaction: tx 
      });
      await tx.commit();
      return list;
    }
    catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async createCoa(tenantId: string, data: { code: string, name: string, type: string, normal_balance: string }) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      if (!/^\d+$/.test(data.code)) {
        throw new BadRequestException('Kode akun hanya boleh berisi angka.');
      }
      const existing = await this.coaRepository.findOne({
        where: { code: data.code },
        transaction: tx,
      });
      if (existing) {
        throw new BadRequestException('Kode akun sudah digunakan.');
      }
      const coa = await this.coaRepository.create(data as any, { transaction: tx });
      await tx.commit();
      return coa;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async updateCoa(tenantId: string, id: string, data: { code?: string, name?: string, type?: string, normal_balance?: string, is_active?: boolean }) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const coa = await this.coaRepository.findByPk(id, { transaction: tx });
      if (!coa) {
        throw new BadRequestException('Akun tidak ditemukan.');
      }
      if (data.code && data.code !== coa.code) {
        if (!/^\d+$/.test(data.code)) {
          throw new BadRequestException('Kode akun hanya boleh berisi angka.');
        }
        const existing = await this.coaRepository.findOne({
          where: { code: data.code },
          transaction: tx,
        });
        if (existing) {
          throw new BadRequestException('Kode akun sudah digunakan.');
        }
      }
      await coa.update(data, { transaction: tx });
      await tx.commit();
      return coa;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async deleteCoa(tenantId: string, id: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const coa = await this.coaRepository.findByPk(id, { transaction: tx });
      if (!coa) {
        throw new BadRequestException('Akun tidak ditemukan.');
      }
      const isUsed = await this.journalLineRepository.findOne({
        where: { coa_id: id },
        transaction: tx,
      });
      if (isUsed) {
        throw new BadRequestException('Gagal menghapus! Akun ini sudah memiliki riwayat jurnal/transaksi.');
      }
      await coa.destroy({ transaction: tx });
      await tx.commit();
      return { success: true };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async seedNetflixCoa(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const seedData = [
        { code: '1060', name: 'Persediaan Netflix Harian', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
        { code: '1061', name: 'Persediaan Netflix Mingguan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
        { code: '1062', name: 'Persediaan Netflix Bulanan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
        { code: '1063', name: 'Persediaan Netflix Sharing Bulanan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
        
        { code: '2010', name: 'Pendapatan Diterima di Muka - Netflix Harian', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
        { code: '2011', name: 'Pendapatan Diterima di Muka - Netflix Mingguan', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
        { code: '2012', name: 'Pendapatan Diterima di Muka - Netflix Bulanan', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
        { code: '2013', name: 'Pendapatan Diterima di Muka - Netflix Sharing', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
        
        { code: '4010', name: 'Pendapatan Realisasi Netflix Harian', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
        { code: '4011', name: 'Pendapatan Realisasi Netflix Mingguan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
        { code: '4012', name: 'Pendapatan Realisasi Netflix Bulanan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
        { code: '4013', name: 'Pendapatan Realisasi Netflix Sharing Bulanan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
        
        { code: '5010', name: 'HPP Netflix Harian', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
        { code: '5011', name: 'HPP Netflix Mingguan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
        { code: '5012', name: 'HPP Netflix Bulanan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
        { code: '5013', name: 'HPP Netflix Sharing Bulanan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
      ];

      for (const data of seedData) {
        const existing = await this.coaRepository.findOne({
          where: { code: data.code },
          transaction: tx,
        });
        if (!existing) {
          await this.coaRepository.create(data as any, { transaction: tx });
        }
      }

      await tx.commit();
      return { success: true, message: 'COA Netflix successfully seeded' };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async createJournalEntry(
    tenantId: string,
    dto: CreateJournalEntryDto,
    existingTx?: SequelizeTransaction,
  ) {
    const isExternalTx = !!existingTx;
    const tx = existingTx || await this.postgresProvider.transaction();

    try {
      if (!isExternalTx) {
        await this.postgresProvider.setSchema(tenantId, tx);
      }

      // Cek apakah periode sudah ditutup
      const dateObj = new Date(dto.date);
      const dateStr = dateObj.toISOString().split('T')[0];
      const period = await this.accountingPeriodRepository.findOne({
        where: {
          start_date: { [Op.lte]: dateStr },
          end_date: { [Op.gte]: dateStr }
        },
        transaction: tx
      });

      if (period && period.is_closed) {
        throw new BadRequestException(`Periode akuntansi untuk tanggal ${dateStr} sudah ditutup dan tidak dapat menerima jurnal baru.`);
      }

      // Validasi Double Entry
      let totalDebit = 0;
      let totalCredit = 0;
      for (const line of dto.lines) {
        totalDebit += Number(line.debit);
        totalCredit += Number(line.credit);
      }

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new BadRequestException(
          `Jurnal tidak balance. Total Debit: ${totalDebit}, Total Kredit: ${totalCredit}`,
        );
      }

      // Pastikan COA ada semua
      const codes = dto.lines.map(l => l.coa_code);
      const coasList = await this.coaRepository.findAll({
        where: { code: codes },
        transaction: tx,
      });

      const coaMap = new Map<string, string>();
      for (const c of coasList) {
        coaMap.set(c.code, c.id);
      }

      for (const code of codes) {
        if (!coaMap.has(code)) {
          throw new BadRequestException(`COA dengan kode ${code} tidak ditemukan.`);
        }
      }

      // Buat Header
      const entry = await this.journalEntryRepository.create(
        {
          transaction_date: dto.date,
          date: dto.date, // <--- Backward compatibility for NOT NULL constraint
          reference_number: dto.reference || null,
          description: dto.description,
          source: dto.source || 'MANUAL',
          status: 'POSTED',
        } as any,
        { transaction: tx },
      );

      // Buat Lines
      for (const line of dto.lines) {
        // Skip jika nilai nol
        if (line.debit === 0 && line.credit === 0)
          continue;

        await this.journalLineRepository.create(
          {
            journal_entry_id: entry.id,
            coa_id: coaMap.get(line.coa_code)!,
            debit: line.debit,
            credit: line.credit,
            memo: line.memo || null,
          } as any,
          { transaction: tx },
        );
      }

      if (!isExternalTx) {
        await tx.commit();
      }

      return entry;
    }
    catch (error) {
      if (!isExternalTx) {
        await tx.rollback();
      }
      throw error;
    }
  }
  async getJournalEntries(tenantId: string, startDate?: string, endDate?: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const where: any = {};
      if (startDate && endDate) {
        where.transaction_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      } else if (startDate) {
        where.transaction_date = { [Op.gte]: new Date(startDate) };
      } else if (endDate) {
        where.transaction_date = { [Op.lte]: new Date(endDate) };
      }

      const list = await this.journalEntryRepository.findAll({
        where,
        include: [{ model: JournalLine, include: [Coa] }],
        order: [['transaction_date', 'DESC']],
        transaction: tx,
      });
      await tx.commit();
      return list;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getLedger(tenantId: string, coaId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const lines = await this.journalLineRepository.findAll({
        where: { coa_id: coaId },
        include: [{ model: JournalEntry, as: 'journal_entry' }],
        order: [[{ model: JournalEntry, as: 'journal_entry' }, 'transaction_date', 'ASC']],
        transaction: tx,
      });
      await tx.commit();
      return lines;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getTrialBalance(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const coas = await this.coaRepository.findAll({
        include: [{ model: JournalLine }],
        order: [['code', 'ASC']],
        transaction: tx,
      });
      
      const trialBalance = coas.map(coa => {
        let totalDebit = 0;
        let totalCredit = 0;
        coa.journal_lines?.forEach(line => {
          totalDebit += Number(line.debit);
          totalCredit += Number(line.credit);
        });

        // Hitung ending balance berdasarkan normal balance
        let balance = 0;
        if (coa.normal_balance === 'DEBIT') {
          balance = totalDebit - totalCredit;
        } else {
          balance = totalCredit - totalDebit;
        }

        return {
          coa_id: coa.id,
          coa_code: coa.code,
          coa_name: coa.name,
          normal_balance: coa.normal_balance,
          total_debit: totalDebit,
          total_credit: totalCredit,
          ending_balance: balance
        };
      });

      await tx.commit();
      return trialBalance;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async voidJournal(tenantId: string, id: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const entry = await this.journalEntryRepository.findByPk(id, { transaction: tx });
      if (!entry) throw new BadRequestException('Jurnal tidak ditemukan');
      if (entry.status === 'VOID') throw new BadRequestException('Jurnal sudah dibatalkan sebelumnya');

      const dateStr = new Date(entry.transaction_date).toISOString().split('T')[0];
      const period = await this.accountingPeriodRepository.findOne({
        where: {
          start_date: { [Op.lte]: dateStr },
          end_date: { [Op.gte]: dateStr }
        },
        transaction: tx
      });

      if (period && period.is_closed) {
        throw new BadRequestException('Tidak dapat membatalkan jurnal pada periode yang sudah ditutup');
      }

      await entry.update({ status: 'VOID' }, { transaction: tx });
      
      await tx.commit();
      return { success: true, message: 'Jurnal berhasil dibatalkan' };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getIncomeStatement(tenantId: string, startDate?: string, endDate?: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const dateFilter: any = {};
      if (startDate && endDate) {
        dateFilter.transaction_date = {
          [Op.between]: [startDate, endDate]
        };
      } else if (startDate) {
        dateFilter.transaction_date = { [Op.gte]: startDate };
      } else if (endDate) {
        dateFilter.transaction_date = { [Op.lte]: endDate };
      }

      const lines = await this.journalLineRepository.findAll({
        include: [
          { 
            model: JournalEntry, 
            where: { ...dateFilter, status: 'POSTED' },
            required: true
          },
          { 
            model: Coa, 
            where: { type: { [Op.in]: ['PENDAPATAN', 'HPP', 'BEBAN'] } },
            required: true
          }
        ],
        transaction: tx
      });

      let totalRevenue = 0;
      let totalCogs = 0;
      let totalExpense = 0;

      lines.forEach(line => {
        const coa = line.coa;
        const balanceChange = coa.normal_balance === 'DEBIT' 
          ? Number(line.debit) - Number(line.credit)
          : Number(line.credit) - Number(line.debit);

        if (coa.type === 'PENDAPATAN') totalRevenue += balanceChange;
        if (coa.type === 'HPP') totalCogs += balanceChange;
        if (coa.type === 'BEBAN') totalExpense += balanceChange;
      });

      await tx.commit();
      
      const grossProfit = totalRevenue - totalCogs;
      const netIncome = grossProfit - totalExpense;

      return {
        revenue: totalRevenue,
        cogs: totalCogs,
        gross_profit: grossProfit,
        expense: totalExpense,
        net_income: netIncome
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getBalanceSheet(tenantId: string, asOfDate?: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const dateFilter = asOfDate ? { transaction_date: { [Op.lte]: asOfDate } } : {};

      const lines = await this.journalLineRepository.findAll({
        include: [
          { model: JournalEntry, where: { ...dateFilter, status: 'POSTED' }, required: true },
          { model: Coa, required: true }
        ],
        transaction: tx
      });

      let totalAsset = 0;
      let totalLiability = 0;
      let totalEquity = 0;
      let netIncome = 0;

      lines.forEach(line => {
        const coa = line.coa;
        const balanceChange = coa.normal_balance === 'DEBIT' 
          ? Number(line.debit) - Number(line.credit)
          : Number(line.credit) - Number(line.debit);

        if (coa.type === 'ASET') totalAsset += balanceChange;
        if (coa.type === 'KEWAJIBAN') totalLiability += balanceChange;
        if (coa.type === 'MODAL') totalEquity += balanceChange;
        if (coa.type === 'PENDAPATAN') netIncome += balanceChange;
        if (coa.type === 'HPP') netIncome -= balanceChange;
        if (coa.type === 'BEBAN') netIncome -= balanceChange;
      });

      // Laba/Rugi tahun berjalan otomatis masuk ke Ekuitas
      const totalEquityWithIncome = totalEquity + netIncome;

      await tx.commit();

      return {
        assets: totalAsset,
        liabilities: totalLiability,
        equity: totalEquity,
        current_earnings: netIncome,
        total_liabilities_equity: totalLiability + totalEquityWithIncome,
        is_balanced: Math.abs(totalAsset - (totalLiability + totalEquityWithIncome)) < 0.01
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getPeriods(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const list = await this.accountingPeriodRepository.findAll({ 
        order: [['start_date', 'DESC']],
        transaction: tx 
      });
      await tx.commit();
      return list;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async closePeriod(tenantId: string, periodName: string, startDate: string, endDate: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      
      const existing = await this.accountingPeriodRepository.findOne({
        where: {
          [Op.or]: [
            { period_name: periodName },
            {
              start_date: { [Op.lte]: endDate },
              end_date: { [Op.gte]: startDate }
            }
          ]
        },
        transaction: tx
      });

      if (existing) {
        throw new BadRequestException('Periode dengan nama tersebut atau bersinggungan tanggal sudah ada.');
      }

      // Hitung Pendapatan & Beban untuk jurnal penutup (Closing Entries)
      // Karena kita full double entry, pembuatan closing entry mewajibkan pemindahan saldo per akun secara fisik.
      // Untuk simplifikasi pada fase ini, kita asumsikan laporan Neraca kita mengakumulasikan PENDAPATAN & BEBAN otomatis
      // sehingga tidak mewajibkan closing entry lengkap untuk semua akun pendapatan/beban 
      // asalkan net income sudah terhitung dinamis di query Balance Sheet.
      // Jadi kita cukup MENGUNCI periode saja (Soft Closing).

      const newPeriod = await this.accountingPeriodRepository.create({
        period_name: periodName,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        is_closed: true
      } as any, { transaction: tx });

      await tx.commit();
      return newPeriod;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async autoJournalTransaction(tenantId: string, transactionId: string, existingTx?: SequelizeTransaction) {
    const isExternalTx = !!existingTx;
    const tx = existingTx || await this.postgresProvider.transaction();

    try {
      if (!isExternalTx) {
        await this.postgresProvider.setSchema(tenantId, tx);
      }

      // Load transaction
      const txDataRaw = await this.postgresProvider.rawQuery(
        `SELECT t.* FROM "transaction" t WHERE t.id = :id`,
        { replacements: { id: transactionId }, type: 'SELECT', transaction: tx }
      );
      if (!txDataRaw || (txDataRaw as any[]).length === 0) {
        if (!isExternalTx) await tx.commit();
        return null; // not found
      }
      const t: any = (txDataRaw as any[])[0];

      // Load items & product_variant to get income_coa_id
      const itemsRaw = await this.postgresProvider.rawQuery(
        `SELECT ti.*, COALESCE(pv.income_coa_id, pv_voucher.income_coa_id) as income_coa_id
         FROM "transaction_item" ti 
         LEFT JOIN "account_user" au ON ti.account_user_id = au.id
         LEFT JOIN "account" a ON au.account_id = a.id
         LEFT JOIN "product_variant" pv ON a.product_variant_id = pv.id
         LEFT JOIN "voucher" v ON CAST(v.transaction_id AS VARCHAR) = CAST(ti.transaction_id AS VARCHAR)
         LEFT JOIN "product_variant" pv_voucher ON CAST(v.product_variant_id AS VARCHAR) = CAST(pv_voucher.id AS VARCHAR)
         WHERE ti.transaction_id = :txId`,
        { replacements: { txId: transactionId }, type: 'SELECT', transaction: tx }
      );

      // Load platform setting (case-insensitive)
      const platformSetting = await this.platformAccountingSettingRepository.findOne({
        where: where(
          fn('LOWER', col('platform')),
          t.platform.toLowerCase()
        ),
        transaction: tx
      });

      if (!platformSetting) {
        throw new BadRequestException(`Pengaturan Akuntansi untuk Platform '${t.platform}' belum dikonfigurasi.`);
      }

      const lines: any[] = [];

      // 1. Debit Kas (Asset) sejumlah net_profit
      if (Number(t.net_profit) > 0) {
        const assetCoa = await this.coaRepository.findByPk(platformSetting.asset_coa_id, { transaction: tx });
        lines.push({
          coa_code: assetCoa?.code || '',
          debit: Number(t.net_profit),
          credit: 0,
          memo: `Penerimaan Kas - ${t.customer}`,
        });
      }

      // 2. Debit Beban Admin (MDR + Platform Fee)
      const totalFee = Number(t.mdr_fee || 0) + Number(t.platform_fee || 0);
      if (totalFee > 0) {
        const expenseCoa = await this.coaRepository.findByPk(platformSetting.expense_coa_id, { transaction: tx });
        lines.push({
          coa_code: expenseCoa?.code || '',
          debit: totalFee,
          credit: 0,
          memo: `Biaya Admin Platform - ${t.platform}`,
        });
      }

      // 3. Kredit Pendapatan (menggunakan total_price transaksi)
      const firstValidItem = (itemsRaw as any[]).find(i => i.income_coa_id);
      if (!firstValidItem && Number(t.total_price) > 0) {
        console.error('DEBUG itemsRaw:', JSON.stringify(itemsRaw, null, 2));
        throw new BadRequestException(`Varian Produk pada item transaksi belum memiliki Akun Pendapatan yang disetting.`);
      }

      if (firstValidItem && Number(t.total_price) > 0) {
        const incomeCoa = await this.coaRepository.findByPk(firstValidItem.income_coa_id, { transaction: tx });
        lines.push({
          coa_code: incomeCoa?.code || '',
          debit: 0,
          credit: Number(t.total_price),
          memo: `Pendapatan Penjualan - ${t.customer}`,
        });
      }

      const journalDto: CreateJournalEntryDto = {
        date: new Date(t.created_at || new Date()),
        reference: transactionId,
        description: `Penjualan via ${t.platform} - ${t.customer}`,
        source: t.platform,
        lines: lines,
      };

      const result = await this.createJournalEntry(tenantId, journalDto, tx);

      if (!isExternalTx) {
        await tx.commit();
      }
      return result;
    } catch (error) {
      if (!isExternalTx) {
        await tx.rollback();
      }
      throw error;
    }
  }

  async autoJournalCapital(tenantId: string, capitalId: string, accountEmail: string, existingTx?: SequelizeTransaction) {
    const isExternalTx = !!existingTx;
    const tx = existingTx || await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const capitalRaw: any[] = await this.postgresProvider.rawQuery(
        `SELECT amount, payment_coa_id, expense_coa_id FROM account_capital WHERE id = :capitalId`,
        { replacements: { capitalId }, type: 'SELECT', transaction: tx }
      ) as any[];
      if (!capitalRaw || capitalRaw.length === 0) return;

      const { amount, payment_coa_id, expense_coa_id } = capitalRaw[0] as any;
      if (!payment_coa_id || !expense_coa_id) return; // Silent return if not mapped

      const coas = await this.coaRepository.findAll({
        where: { id: { [Op.in]: [payment_coa_id, expense_coa_id] } },
        transaction: tx
      });

      const paymentCoa = coas.find(c => c.id == payment_coa_id);
      const expenseCoa = coas.find(c => c.id == expense_coa_id);

      if (!paymentCoa || !expenseCoa) {
        this.logger.warn(`Failed auto journal capital ${capitalId}: One or both COAs not found`);
        return;
      }

      const journalDto: CreateJournalEntryDto = {
        date: new Date(),
        reference: `CAPITAL-${capitalId}`,
        description: `Penambahan Modal / HPP: ${accountEmail}`,
        source: 'AUTO_CAPITAL',
        lines: [
          { coa_code: expenseCoa.code, debit: amount, credit: 0, memo: 'HPP / Beban' },
          { coa_code: paymentCoa.code, debit: 0, credit: amount, memo: 'Kas / Bank' },
        ],
      };

      const result = await this.createJournalEntry(tenantId, journalDto, tx);

      if (!isExternalTx) {
        await tx.commit();
      }
      return result;
    } catch (error) {
      if (!isExternalTx) {
        await tx.rollback();
      }
      throw error;
    }
  }

  // --- Platform Accounting Settings CRUD ---

  async getPlatformSettings(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const settings = await this.platformAccountingSettingRepository.findAll({ transaction: tx });
      await tx.commit();
      return settings;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async createPlatformSetting(tenantId: string, data: { platform: string, asset_coa_id: string, expense_coa_id: string }) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const existing = await this.platformAccountingSettingRepository.findOne({
        where: { platform: data.platform },
        transaction: tx,
      });
      if (existing) {
        throw new BadRequestException(`Pengaturan akuntansi untuk platform ${data.platform} sudah ada.`);
      }
      const setting = await this.platformAccountingSettingRepository.create(data as any, { transaction: tx });
      await tx.commit();
      return setting;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async updatePlatformSetting(tenantId: string, id: string, data: { platform?: string, asset_coa_id?: string, expense_coa_id?: string }) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const setting = await this.platformAccountingSettingRepository.findByPk(id, { transaction: tx });
      if (!setting) {
        throw new NotFoundException('Pengaturan platform tidak ditemukan.');
      }
      if (data.platform && data.platform !== setting.platform) {
        const existing = await this.platformAccountingSettingRepository.findOne({
          where: { platform: data.platform },
          transaction: tx,
        });
        if (existing) {
          throw new BadRequestException(`Pengaturan akuntansi untuk platform ${data.platform} sudah ada.`);
        }
      }
      await setting.update(data, { transaction: tx });
      await tx.commit();
      return setting;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async deletePlatformSetting(tenantId: string, id: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const setting = await this.platformAccountingSettingRepository.findByPk(id, { transaction: tx });
      if (!setting) {
        throw new NotFoundException('Pengaturan platform tidak ditemukan.');
      }
      await setting.destroy({ transaction: tx });
      await tx.commit();
      return { success: true };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  // --- Journal Templates ---

  async getJournalTemplates(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const templates = await this.journalTemplateRepository.findAll({
        include: [{ model: JournalTemplateItem, as: 'items', include: [{ model: Coa, as: 'coa', attributes: ['id', 'code', 'name'] }] }],
        order: [['name', 'ASC'], [{ model: JournalTemplateItem, as: 'items' }, 'position', 'DESC']],
        transaction: tx
      });
      await tx.commit();
      return templates;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async createJournalTemplate(tenantId: string, payload: CreateJournalTemplateDto) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const template = await this.journalTemplateRepository.create({
        tenant_id: tenantId,
        name: payload.name,
        description: payload.description,
      } as any, { transaction: tx });

      if (payload.items && payload.items.length > 0) {
        for (const item of payload.items) {
          await this.journalTemplateItemRepository.create({
            journal_template_id: template.id,
            coa_id: item.coa_id || null,
            position: item.position,
          } as any, { transaction: tx });
        }
      }

      await tx.commit();
      return template;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async updateJournalTemplate(tenantId: string, id: string, payload: UpdateJournalTemplateDto) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const template = await this.journalTemplateRepository.findByPk(id, { transaction: tx });
      if (!template) throw new NotFoundException('Template tidak ditemukan.');

      await template.update({
        name: payload.name !== undefined ? payload.name : template.name,
        description: payload.description !== undefined ? payload.description : template.description,
      }, { transaction: tx });

      if (payload.items !== undefined) {
        await this.journalTemplateItemRepository.destroy({ where: { journal_template_id: id }, transaction: tx });
        for (const item of payload.items) {
          await this.journalTemplateItemRepository.create({
            journal_template_id: template.id,
            coa_id: item.coa_id || null,
            position: item.position,
          } as any, { transaction: tx });
        }
      }

      await tx.commit();
      return template;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async deleteJournalTemplate(tenantId: string, id: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const template = await this.journalTemplateRepository.findByPk(id, { transaction: tx });
      if (!template) throw new NotFoundException('Template tidak ditemukan.');

      await template.destroy({ transaction: tx });
      await tx.commit();
      return { success: true };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  // --- Internal Helpers ---
  async getPlatformSettingByPlatform(tenantId: string, platform: string, tx?: any): Promise<any> {
    await this.postgresProvider.setSchema(tenantId, tx);
    return this.platformAccountingSettingRepository.findOne({
      where: where(
        fn('LOWER', col('platform')),
        platform.toLowerCase()
      ),
      transaction: tx
    });
  }
}
