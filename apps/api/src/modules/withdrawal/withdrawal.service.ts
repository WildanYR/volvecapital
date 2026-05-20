import { Inject, Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as crypto from 'node:crypto';
import { Op, WhereOptions } from 'sequelize';
import {
  TRANSACTION_REPOSITORY,
  TENANT_SETTING_REPOSITORY,
  WITHDRAWAL_REQUEST_REPOSITORY,
} from 'src/constants/database.const';
import { TenantSetting } from 'src/database/models/tenant-setting.model';
import { Transaction } from 'src/database/models/transaction.model';
import { WithdrawalRequest } from 'src/database/models/withdrawal-request.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { SnowflakeIdProvider } from '../utility/snowflake-id.provider';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Injectable()
export class WithdrawalService {
  private readonly logger = new Logger('WithdrawalService');

  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly snowflakeIdProvider: SnowflakeIdProvider,
    private readonly configService: ConfigService,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(TENANT_SETTING_REPOSITORY)
    private readonly tenantSettingRepository: typeof TenantSetting,
    @Inject(WITHDRAWAL_REQUEST_REPOSITORY)
    private readonly withdrawalRequestRepository: typeof WithdrawalRequest,
  ) {}

  async getWalletBalance(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      // 1. Calculate Total Net Profit from transactions older than T+2 (cleared)
      const tPlus2 = new Date();
      tPlus2.setDate(tPlus2.getDate() - 2);

      const [profitResult] = await this.postgresProvider.rawQuery(
        `SELECT SUM(net_profit) as total_profit FROM transaction WHERE created_at <= :tPlus2`,
        { replacements: { tPlus2 }, transaction: tx }
      );
      
      const totalProfit = Number((profitResult as any)[0]?.total_profit || 0);

      // 2. Calculate Pending Balance (transactions within T+2, not yet cleared)
      const [pendingResult] = await this.postgresProvider.rawQuery(
        `SELECT SUM(net_profit) as pending_profit FROM transaction WHERE created_at > :tPlus2`,
        { replacements: { tPlus2 }, transaction: tx }
      );

      const pendingBalance = Number((pendingResult as any)[0]?.pending_profit || 0);

      // 3. Calculate Total Withdrawn or Pending/Processing
      const [wdResult] = await this.postgresProvider.rawQuery(
        `SELECT SUM(amount + admin_fee) as total_wd FROM withdrawal_request WHERE status IN ('PENDING', 'APPROVED', 'PROCESSING', 'SUCCESS')`,
        { transaction: tx }
      );

      const totalWd = Number((wdResult as any)[0]?.total_wd || 0);

      const availableBalance = totalProfit - totalWd;

      await tx.commit();
      return {
        available_balance: availableBalance,
        pending_balance: pendingBalance,
        total_profit: totalProfit,
        total_withdrawal: totalWd
      };
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async getHistory(tenantId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);
      const history = await this.withdrawalRequestRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction: tx
      });
      await tx.commit();
      return history;
    } catch (error) {
      await tx.rollback();
      throw error;
    }
  }

  async createRequest(tenantId: string, dto: CreateWithdrawalDto) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const { available_balance } = await this.getWalletBalance(tenantId);
      const adminFee = 2500; // Flat fee for DOKU transfer

      if (dto.amount < 50000) {
        throw new BadRequestException('Minimal penarikan adalah Rp 50.000');
      }

      if (available_balance < (dto.amount + adminFee)) {
        throw new BadRequestException('Saldo tidak mencukupi untuk penarikan ini beserta biayanya');
      }

      // Fetch verified bank account
      const bankAccount = await (this.postgresProvider as any).sequelize.models.TenantBankAccount.findOne({
        where: { id: dto.bank_account_id, is_verified: true },
        transaction: tx,
      }) as any;

      if (!bankAccount) {
        throw new BadRequestException('Rekening bank tidak ditemukan atau belum diverifikasi');
      }

      const id = this.snowflakeIdProvider.generateId();
      
      const request = await this.withdrawalRequestRepository.create({
        id,
        amount: dto.amount,
        admin_fee: adminFee,
        status: 'PENDING',
        bank_info: {
          bank_name: bankAccount.bank_name,
          account_number: bankAccount.account_number,
          account_holder: bankAccount.account_holder
        }
      }, { transaction: tx });

      await tx.commit();
      return request;
    } catch (error) {
      if (tx) {
        try { await tx.rollback(); } catch (e) {}
      }
      throw error;
    }
  }

  // --- Admin Methods ---
  
  async getPendingRequests() {
    // For admin, we might need to query across all tenants, but since schemas are per tenant,
    // this would require querying all schemas.
    // For simplicity and since we don't have a cross-tenant query readily available,
    // we fetch schemas and query each one.
    const schemas = await this.getTenantSchemas();
    const pendingRequests: any[] = [];

    for (const schema of schemas) {
      const tx = await this.postgresProvider.transaction();
      try {
        await this.postgresProvider.setSchema(schema, tx);
        const requests = await this.withdrawalRequestRepository.findAll({
          where: { status: 'PENDING' },
          transaction: tx
        });
        
        for (const req of requests) {
          pendingRequests.push({
            ...req.toJSON(),
            tenant_id: schema
          });
        }
        await tx.commit();
      } catch (err: any) {
        if (tx) {
          try { await tx.rollback(); } catch (e) {}
        }
        this.logger.error(`Failed to get pending requests for tenant ${schema}: ${err.message}`);
      }
    }
    
    // Sort by created_at descending
    return pendingRequests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async approveRequest(tenantId: string, requestId: string) {
    const tx = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, tx);

      const request = await this.withdrawalRequestRepository.findOne({
        where: { id: requestId, status: 'PENDING' },
        transaction: tx
      });

      if (!request) {
        throw new NotFoundException('Request penarikan tidak ditemukan atau status bukan PENDING');
      }

      // We mark it as PROCESSING before calling DOKU
      await request.update({ status: 'PROCESSING' }, { transaction: tx });
      await tx.commit();

      // Proceed with DOKU Payout API outside the main DB transaction to avoid blocking or rollback on timeout
      try {
        const externalId = `WD-${tenantId.toUpperCase()}-${requestId}`;
        // Usually bank code mapping is required for DOKU, we assume bank_name is the bank_code for now or map it if possible.
        // In real world, bank_name from UI should be the DOKU bank code or we map it. 
        // Here we just use bank_name assuming it is the code.

        const payload = {
          request: {
            payouts: [
              {
                amount: request.amount,
                beneficiary: {
                  name: request.bank_info.account_holder,
                  account_number: request.bank_info.account_number,
                  bank_code: request.bank_info.bank_name, 
                },
                description: `Withdrawal Digital Premium - Tenant ${tenantId}`,
                external_id: externalId
              }
            ]
          }
        };

        const response = await this.requestDokuPayout(payload);
        
        // DOKU Payout response might have a reference ID
        // For Sandbox or Mock, we just update it
        const updateTx = await this.postgresProvider.transaction();
        await this.postgresProvider.setSchema(tenantId, updateTx);
        const dokuRef = response?.response?.payouts?.[0]?.reference_id || externalId;
        
        await this.withdrawalRequestRepository.update(
          { doku_reference: dokuRef },
          { where: { id: requestId }, transaction: updateTx }
        );
        await updateTx.commit();
        
        return { message: 'Withdrawal is processing', reference: dokuRef };
      } catch (dokuError: any) {
        // If API fails immediately, we might want to revert or mark FAILED
        const revertTx = await this.postgresProvider.transaction();
        await this.postgresProvider.setSchema(tenantId, revertTx);
        await this.withdrawalRequestRepository.update(
          { status: 'FAILED' },
          { where: { id: requestId }, transaction: revertTx }
        );
        await revertTx.commit();
        throw new BadRequestException(`Gagal mengirim request ke DOKU: ${dokuError.message}`);
      }
    } catch (error) {
      if (tx) {
        try { await tx.rollback(); } catch (e) {}
      }
      throw error;
    }
  }

  // --- Helpers ---

  private async getTenantSchemas(): Promise<string[]> {
    const [results] = await this.postgresProvider.rawQuery(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'master', 'pg_toast') AND schema_name NOT LIKE 'pg_temp_%' AND schema_name NOT LIKE 'pg_toast_%'",
      {}
    );
    return (results as any[]).map(r => r.schema_name);
  }

  private async requestDokuPayout(payload: any): Promise<any> {
    const clientId = this.configService.get<string>('doku.clientId');
    const secretKey = this.configService.get<string>('doku.secretKey') || '';
    const isProd = this.configService.get<boolean>('doku.isProduction');
    
    // Sandbox or Prod URL
    const baseUrl = isProd ? 'api.doku.com' : 'api-sandbox.doku.com';
    const targetPath = '/payout/v1/payout';
    const requestId = `REQ-WD-${Date.now()}`;
    const timestamp = new Date().toISOString().split('.')[0] + 'Z';
    
    const body = JSON.stringify(payload);
    const digest = crypto.createHash('sha256').update(body).digest('base64');
    
    const signatureComponent = `Client-Id:${clientId}\n` +
                               `Request-Id:${requestId}\n` +
                               `Request-Timestamp:${timestamp}\n` +
                               `Request-Target:${targetPath}\n` +
                               `Digest:${digest}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(signatureComponent)
      .digest('base64');

    const options = {
      hostname: baseUrl,
      path: targetPath,
      method: 'POST',
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': `HMACSHA256=${signature}`,
        'Content-Type': 'application/json',
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if ((res.statusCode || 500) >= 200 && (res.statusCode || 500) < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`DOKU Payout API Error: ${JSON.stringify(parsed)}`));
            }
          } catch {
            reject(new Error('Failed to parse DOKU Payout response'));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}
