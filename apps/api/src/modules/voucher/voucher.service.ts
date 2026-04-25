import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PRODUCT_VARIANT_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  TRANSACTION_REPOSITORY,
  VOUCHER_REPOSITORY,
} from 'src/constants/database.const';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction } from 'src/database/models/transaction.model';
import { Voucher } from 'src/database/models/voucher.model';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class VoucherService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly configService: ConfigService,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(TRANSACTION_ITEM_REPOSITORY)
    private readonly transactionItemRepository: typeof TransactionItem,
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: typeof Voucher,
  ) {}

  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'MNL-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async generateManualVoucher(tenantId: string, dto: any) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const variant = await this.productVariantRepository.findOne({
        where: { id: dto.product_variant_id },
        include: [{ model: Product, as: 'product' }],
        transaction,
      });
      if (!variant) throw new NotFoundException('Varian produk tidak ditemukan');

      const voucherCode = this.generateVoucherCode();
      const expiryHours = this.configService.get<number>('voucher.expiryHours') ?? 168; // 7 days for manual
      const expiredAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      const orderId = `M-${tenantId.toUpperCase().substring(0, 3)}-${Date.now()}`;

      // 1. Create transaction
      const txn = await this.transactionRepository.create(
        {
          id: orderId,
          customer: dto.buyer_name,
          platform: 'dashboard',
          total_price: variant.price, // Uses variant price instead of 0
        },
        { transaction },
      );

      // 2. Create transaction item
      const txnItem = await this.transactionItemRepository.create(
        {
          name: `${(variant as any).product?.name ?? 'Produk'} - ${variant.name} (Manual)`,
          transaction_id: txn.id,
        },
        { transaction },
      );

      // 3. Create voucher
      const voucher = await this.voucherRepository.create(
        {
          id: voucherCode,
          product_variant_id: dto.product_variant_id,
          buyer_name: dto.buyer_name,
          buyer_email: dto.buyer_email,
          buyer_whatsapp: dto.buyer_whatsapp,
          expired_at: expiredAt,
          transaction_id: txn.id,
          transaction_item_id: txnItem.id,
          payment_id: orderId,
          status: 'UNUSED',
          payment_status: 'PAID', // Directly PAID because manual
        },
        { transaction },
      );

      await transaction.commit();
      return voucher;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getVouchers(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const vouchers = await this.voucherRepository.findAll({
        include: [
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Product, as: 'product' }],
          },
        ],
        order: [['created_at', 'DESC']],
        limit: 50,
        transaction,
      });
      await transaction.commit();
      return vouchers;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
