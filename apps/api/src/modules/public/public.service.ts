import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as nodemailer from 'nodemailer';
import { Op } from 'sequelize';
import {
  ACCOUNT_PROFILE_REPOSITORY,
  ACCOUNT_REPOSITORY,
  ACCOUNT_USER_REPOSITORY,
  PRODUCT_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  TRANSACTION_ITEM_REPOSITORY,
  TRANSACTION_REPOSITORY,
  VOUCHER_REPOSITORY,
} from 'src/constants/database.const';
import { AccountProfile } from 'src/database/models/account-profile.model';
import { AccountUser } from 'src/database/models/account-user.model';
import { Account } from 'src/database/models/account.model';
import { Email } from 'src/database/models/email.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction } from 'src/database/models/transaction.model';
import { Voucher } from 'src/database/models/voucher.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';

@Injectable()
export class PublicService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly configService: ConfigService,
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: typeof Product,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: typeof Account,
    @Inject(ACCOUNT_PROFILE_REPOSITORY)
    private readonly accountProfileRepository: typeof AccountProfile,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: typeof Transaction,
    @Inject(TRANSACTION_ITEM_REPOSITORY)
    private readonly transactionItemRepository: typeof TransactionItem,
    @Inject(VOUCHER_REPOSITORY)
    private readonly voucherRepository: typeof Voucher,
  ) {}

  // ─── LIST PRODUCTS ──────────────────────────────────────────────────────────

  async getProducts(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const products = await this.productRepository.findAll({
        include: [{ model: ProductVariant, as: 'variants' }],
        order: [
          ['name', 'ASC'],
          [{ model: ProductVariant, as: 'variants' }, 'name', 'ASC'],
        ],
        transaction,
      });

      await transaction.commit();
      return products;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── GENERATE VOUCHER CODE ───────────────────────────────────────────────────

  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'VC-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ─── CREATE PAYMENT (MIDTRANS) ───────────────────────────────────────────────

  async createPayment(tenantId: string, dto: CreatePaymentDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Validate variant exists
      const variant = await this.productVariantRepository.findOne({
        where: { id: dto.product_variant_id },
        include: [{ model: Product, as: 'product' }],
        transaction,
      });
      if (!variant) {
        throw new NotFoundException('Produk varian tidak ditemukan');
      }

      // 2. Check stock availability
      const stockCount = await this.accountRepository.count({
        where: {
          product_variant_id: dto.product_variant_id,
          status: 'ready',
          subscription_expiry: { [Op.gt]: new Date() },
        },
        transaction,
      });
      if (stockCount === 0) {
        throw new ServiceUnavailableException(
          'Stok habis, silahkan hubungi admin',
        );
      }

      // 3. Generate unique voucher code
      let voucherCode = this.generateVoucherCode();
      let codeExists = await this.voucherRepository.findOne({
        where: { id: voucherCode },
        transaction,
      });
      while (codeExists) {
        voucherCode = this.generateVoucherCode();
        codeExists = await this.voucherRepository.findOne({
          where: { id: voucherCode },
          transaction,
        });
      }

      // 4. Calculate expiry
      const expiryHours = this.configService.get<number>('voucher.expiryHours') ?? 24;
      const expiredAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

      // 5. Build Midtrans order
      const orderId = `VC-${tenantId.toUpperCase()}-${Date.now()}`;
      const grossAmount = variant.price;

      const midtransPayload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: grossAmount,
        },
        item_details: [
          {
            id: variant.id,
            price: grossAmount,
            quantity: 1,
            name: `${(variant as any).product?.name ?? 'Produk'} - ${variant.name}`,
          },
        ],
        customer_details: {
          first_name: dto.buyer_name,
          email: dto.buyer_email,
          phone: dto.buyer_whatsapp,
        },
        custom_field1: voucherCode,
        custom_field2: tenantId,
      };

      const snapToken = await this.requestMidtransSnapToken(midtransPayload);

      // 6. Create transaction record
      const txn = await this.transactionRepository.create(
        {
          id: orderId,
          customer: dto.buyer_name,
          platform: 'landing',
          total_price: grossAmount,
        },
        { transaction },
      );

      // 7. Create transaction item
      const txnItem = await this.transactionItemRepository.create(
        {
          name: `${(variant as any).product?.name ?? 'Produk'} - ${variant.name}`,
          transaction_id: txn.id,
        },
        { transaction },
      );

      // 8. Save voucher
      await this.voucherRepository.create(
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
          payment_status: 'PENDING',
        },
        { transaction },
      );

      await transaction.commit();

      return {
        snap_token: snapToken,
        voucher_code: voucherCode,
        order_id: orderId,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── MIDTRANS SNAP TOKEN REQUEST ─────────────────────────────────────────────

  private async requestMidtransSnapToken(payload: object): Promise<string> {
    const serverKey = this.configService.get<string>('midtrans.serverKey') ?? '';
    const isProduction = this.configService.get<boolean>('midtrans.isProduction');
    const baseUrl = isProduction
      ? 'app.midtrans.com'
      : 'app.sandbox.midtrans.com';

    const auth = Buffer.from(`${serverKey}:`).toString('base64');

    return new Promise((resolve, reject) => {
      const body = JSON.stringify(payload);
      const options = {
        hostname: baseUrl,
        path: '/snap/v1/transactions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              resolve(parsed.token);
            }
            else {
              reject(new Error(`Midtrans error: ${JSON.stringify(parsed)}`));
            }
          }
          catch {
            reject(new Error('Failed to parse Midtrans response'));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ─── PAYMENT NOTIFY WEBHOOK ──────────────────────────────────────────────────

  async handlePaymentNotify(tenantId: string, body: any) {
    const { order_id, transaction_status, fraud_status } = body;

    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const voucher = await this.voucherRepository.findOne({
        where: { payment_id: order_id },
        transaction,
      });
      if (!voucher) {
        await transaction.commit();
        return { ok: true };
      }

      const isPaid
        = transaction_status === 'settlement'
          || (transaction_status === 'capture' && fraud_status === 'accept');
      const isExpiredOrFailed
        = transaction_status === 'expire'
          || transaction_status === 'cancel'
          || transaction_status === 'deny';

      if (isPaid) {
        await voucher.update({ payment_status: 'PAID' }, { transaction });
      }
      else if (isExpiredOrFailed) {
        await voucher.update(
          { payment_status: 'FAILED', status: 'EXPIRED' },
          { transaction },
        );
      }

      await transaction.commit();
      return { ok: true };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── GET VOUCHER BY CODE ─────────────────────────────────────────────────────

  async getVoucher(tenantId: string, code: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const voucher = await this.voucherRepository.findOne({
        where: { id: code },
        include: [
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Product, as: 'product' }],
          },
        ],
        transaction,
      });

      if (!voucher) {
        throw new NotFoundException('Voucher tidak ditemukan');
      }

      // If USED, also load account info via transaction_item → account_user → account → email
      let accountInfo: any = null;
      if (voucher.status === 'USED' && voucher.transaction_item_id) {
        const txnItem = await this.transactionItemRepository.findOne({
          where: { id: voucher.transaction_item_id },
          include: [
            {
              model: AccountUser,
              as: 'user',
              include: [
                {
                  model: Account,
                  as: 'account',
                  include: [{ model: Email, as: 'email' }],
                },
                { model: AccountProfile, as: 'profile' },
              ],
            },
          ],
          transaction,
        });
        if (txnItem?.user) {
          const user = txnItem.user as any;
          accountInfo = {
            email: user.account?.email?.email,
            password: user.account?.account_password,
            profile_name: user.profile?.name,
            expired_at: user.expired_at,
            copy_template: voucher.product_variant?.copy_template ?? null,
          };
        }
      }

      await transaction.commit();
      return { voucher, account: accountInfo };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── REDEEM VOUCHER ──────────────────────────────────────────────────────────

  async redeemVoucher(tenantId: string, dto: RedeemVoucherDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Validate voucher
      const voucher = await this.voucherRepository.findOne({
        where: { id: dto.voucher_code },
        include: [{ model: ProductVariant, as: 'product_variant' }],
        transaction,
      });

      if (!voucher) {
        throw new NotFoundException('Kode voucher tidak ditemukan');
      }
      if (voucher.payment_status !== 'PAID') {
        throw new BadRequestException('Pembayaran belum dikonfirmasi');
      }
      if (voucher.status === 'USED') {
        throw new BadRequestException('Voucher sudah pernah digunakan');
      }
      if (voucher.status === 'EXPIRED' || voucher.expired_at < new Date()) {
        throw new BadRequestException('Voucher sudah kadaluarsa');
      }

      const variant = voucher.product_variant!;

      // 2. Find available account
      const account = await this.accountRepository.findOne({
        where: {
          product_variant_id: voucher.product_variant_id,
          status: 'ready',
          subscription_expiry: { [Op.gt]: new Date() },
        },
        include: [
          { model: Email, as: 'email' },
          {
            model: AccountProfile,
            as: 'profile',
            where: { allow_generate: true },
            required: false,
          },
        ],
        transaction,
      });

      if (!account) {
        throw new ServiceUnavailableException(
          'Maaf, stok akun sedang habis. Hubungi admin.',
        );
      }

      // 3. Find available profile slot
      const profiles: AccountProfile[] = (account as any).profile ?? [];
      let chosenProfile: AccountProfile | null = null;

      for (const profile of profiles) {
        const activeUsers = await this.accountUserRepository.count({
          where: {
            account_profile_id: profile.id,
            status: 'active',
          },
          transaction,
        });
        if (activeUsers < profile.max_user) {
          chosenProfile = profile;
          break;
        }
      }

      if (!chosenProfile) {
        throw new ServiceUnavailableException(
          'Maaf, semua slot akun penuh. Hubungi admin.',
        );
      }

      // 4. Insert account_user
      const expiredAt = new Date(
        Date.now() + Number(variant.duration),
      );

      const accountUser = await this.accountUserRepository.create(
        {
          name: voucher.buyer_name,
          status: 'active',
          account_id: account.id,
          account_profile_id: chosenProfile.id,
          expired_at: expiredAt,
        },
        { transaction },
      );

      // 5. Update transaction_item with account_user_id
      if (voucher.transaction_item_id) {
        await this.transactionItemRepository.update(
          { account_user_id: accountUser.id },
          { where: { id: voucher.transaction_item_id }, transaction },
        );
      }

      // 6. Mark voucher as USED
      await voucher.update({ status: 'USED' }, { transaction });

      await transaction.commit();

      // 7. Send WA notification (non-blocking)
      const accountEmail = (account as any).email?.email ?? '';
      const accountPassword = account.account_password;
      const profileName = chosenProfile.name;
      const copyTemplate = variant.copy_template;

      this.sendVoucherEmail(
        voucher.buyer_email,
        voucher.buyer_name,
        dto.voucher_code,
        accountEmail,
        accountPassword,
        profileName,
        expiredAt,
        copyTemplate,
      ).catch(() => {});

      return {
        voucher_code: dto.voucher_code,
        email: accountEmail,
        password: accountPassword,
        profile_name: profileName,
        expired_at: expiredAt,
        copy_template: copyTemplate,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── CHECK STOCK LOW ─────────────────────────────────────────────────────────

  async getStockStatus(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const threshold = this.configService.get<number>('stock.lowThreshold') ?? 3;

      const variants = await this.productVariantRepository.findAll({
        include: [{ model: Product, as: 'product' }],
        transaction,
      });

      const result: {
        product_variant_id: string;
        product_name: string;
        variant_name: string;
        stock: number;
        low_stock: boolean;
      }[] = [];
      for (const variant of variants) {
        const count = await this.accountRepository.count({
          where: {
            product_variant_id: variant.id,
            status: 'ready',
            subscription_expiry: { [Op.gt]: new Date() },
          },
          transaction,
        });
        result.push({
          product_variant_id: variant.id,
          product_name: (variant as any).product?.name ?? '',
          variant_name: variant.name,
          stock: count,
          low_stock: count <= threshold,
        });
      }

      await transaction.commit();
      return result;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── SEND EMAIL VIA NODEMAILER (MAILTRAP) ───────────────────────────────────
  
  private async sendVoucherEmail(
    email: string,
    buyerName: string,
    voucherCode: string,
    accountEmail: string,
    accountPassword: string,
    profileName: string,
    expiredAt: Date,
    copyTemplate?: string | null,
  ): Promise<void> {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const from = this.configService.get<string>('mail.from');

    if (!host || !user || !pass) return;

    const transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });

    const expiredStr = expiredAt.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const bodyText = copyTemplate
      ? copyTemplate
          .replace('{buyer_name}', buyerName)
          .replace('{email}', accountEmail)
          .replace('{password}', accountPassword)
          .replace('{profile}', profileName)
          .replace('{expired_at}', expiredStr)
          .replace('{voucher_code}', voucherCode)
      : `Halo ${buyerName}! 🎉\n\nVoucher kamu berhasil diredeem!\n\n📧 Email: ${accountEmail}\n🔑 Password: ${accountPassword}\n👤 Profile: ${profileName}\n📅 Aktif hingga: ${expiredStr}\n\nKode Voucher: ${voucherCode}\n\nTerima kasih! 🙏`;

    await transporter.sendMail({
      from: `"Volve Capital" <${from}>`,
      to: email,
      subject: `Aktivasi Voucher ${voucherCode} Berhasil!`,
      text: bodyText,
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #FFB800;">Aktivasi Berhasil! 🎉</h2>
        <p>Halo <strong>${buyerName}</strong>,</p>
        <p>Voucher kamu telah berhasil direaktivasi. Berikut adalah detail akun Anda:</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 5px 0;">📧 <strong>Email:</strong> ${accountEmail}</p>
          <p style="margin: 5px 0;">🔑 <strong>Password:</strong> ${accountPassword}</p>
          <p style="margin: 5px 0;">👤 <strong>Profile:</strong> ${profileName}</p>
          <p style="margin: 5px 0;">📅 <strong>Aktif hingga:</strong> ${expiredStr}</p>
        </div>
        <p>Kode Voucher: <code>${voucherCode}</code></p>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">Terima kasih telah berlangganan di Volve Capital!</p>
      </div>`,
    });
  }
}
