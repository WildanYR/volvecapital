import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as crypto from 'node:crypto';
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
  TENANT_SETTING_REPOSITORY,
  EMAIL_MESSAGE_REPOSITORY,
  EMAIL_SUBJECT_REPOSITORY,
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
import { EmailMessage } from 'src/database/models/email-message.model';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { TenantSetting } from 'src/database/models/tenant-setting.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RedeemVoucherDto } from './dto/redeem-voucher.dto';

@Injectable()
export class PublicService {
  private readonly logger = new Logger('PublicService');

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
    @Inject(TENANT_SETTING_REPOSITORY)
    private readonly tenantSettingRepository: typeof TenantSetting,
    @Inject(EMAIL_MESSAGE_REPOSITORY)
    private readonly emailMessageRepository: typeof EmailMessage,
    @Inject(EMAIL_SUBJECT_REPOSITORY)
    private readonly emailSubjectRepository: typeof EmailSubject,
  ) {}

  async getSettings(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const settings = await this.tenantSettingRepository.findAll({ transaction });
      
      const result: Record<string, string> = {};
      settings.forEach(s => {
        result[s.key] = s.value;
      });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

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

      // 2. Check stock availability (Profile-based)
      const accounts = await this.accountRepository.findAll({
        where: {
          product_variant_id: dto.product_variant_id,
          status: { [Op.ne]: 'disable' },
          subscription_expiry: { [Op.gt]: new Date() },
          freeze_until: null,
        },
        include: [{ model: AccountProfile, as: 'profile', where: { allow_generate: true } }],
        transaction,
      });

      let totalAvailableSlots = 0;
      for (const account of accounts) {
        const profiles = (account as any).profile || [];
        for (const profile of profiles) {
          const activeUsers = await this.accountUserRepository.count({
            where: { account_profile_id: profile.id, status: 'active' },
            transaction,
          });
          const available = profile.max_user - activeUsers;
          if (available > 0) {
            totalAvailableSlots += available;
          }
        }
      }

      if (totalAvailableSlots === 0) {
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
      const expiryHours = variant.voucher_expiry_hours ?? this.configService.get<number>('voucher.expiryHours') ?? 24;
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

      const { token: snapToken, redirect_url: paymentUrl } = await this.requestMidtransSnapToken(midtransPayload);

      // Send invoice email (non-blocking)
      this.logger.log(`[CreatePayment] Triggering invoice email for ${dto.buyer_email}`);
      this.sendInvoiceEmail(
        dto.buyer_email,
        dto.buyer_name,
        paymentUrl,
        `${(variant as any).product?.name ?? 'Produk'} - ${variant.name}`,
        grossAmount,
      ).catch((err) => {
        this.logger.error(`[CreatePayment] Failed to send invoice email: ${err.message}`);
      });

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

  private async requestMidtransSnapToken(payload: object): Promise<{ token: string; redirect_url: string }> {
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
              resolve({
                token: parsed.token,
                redirect_url: parsed.redirect_url,
              });
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
        include: [{ model: ProductVariant, as: 'product_variant', include: [{ model: Product, as: 'product' }] }],
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

      let shouldSendEmail = false;
      if (isPaid && voucher.payment_status !== 'PAID') {
        shouldSendEmail = true;
        await voucher.update({ payment_status: 'PAID' }, { transaction });
      }
      else if (isExpiredOrFailed) {
        await voucher.update(
          { payment_status: 'FAILED', status: 'EXPIRED' },
          { transaction },
        );
      }

      await transaction.commit();

      if (shouldSendEmail) {
        const productName = `${(voucher.product_variant as any)?.product?.name ?? 'Produk'} - ${voucher.product_variant?.name ?? ''}`;
        this.logger.log(`[PaymentNotify] Sending confirmation email for voucher ${voucher.id} to ${voucher.buyer_email}`);
        this.sendPaymentConfirmationEmail(
          voucher.buyer_email,
          voucher.buyer_name,
          voucher.id,
          productName,
        ).catch((err) => {
          this.logger.error(`[PaymentNotify] Failed to send email for voucher ${voucher.id}: ${err.message}`);
        });
      }

      return { ok: true };
    }
    catch (error) {
      if (transaction) await transaction.rollback();
      this.logger.error(`[PaymentNotify] Error handling notify: ${error.message}`);
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
            metadata: user.profile?.metadata ? JSON.parse(user.profile.metadata) : {},
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

      // 2. Find available account & profile slot
      const accounts = await this.accountRepository.findAll({
        where: {
          product_variant_id: voucher.product_variant_id,
          status: { [Op.ne]: 'disable' },
          subscription_expiry: { [Op.gt]: new Date() },
          freeze_until: null,
        },
        include: [
          { model: Email, as: 'email' },
          {
            model: AccountProfile,
            as: 'profile',
            where: { allow_generate: true },
          },
        ],
        transaction,
      });

      let chosenAccount: Account | null = null;
      let chosenProfile: AccountProfile | null = null;

      for (const account of accounts) {
        const profiles: AccountProfile[] = (account as any).profile ?? [];
        for (const profile of profiles) {
          const activeUsers = await this.accountUserRepository.count({
            where: {
              account_profile_id: profile.id,
              status: 'active',
            },
            transaction,
          });
          if (activeUsers < profile.max_user) {
            chosenAccount = account;
            chosenProfile = profile;
            break;
          }
        }
        if (chosenProfile) break;
      }

      if (!chosenAccount || !chosenProfile) {
        throw new ServiceUnavailableException(
          'Maaf, stok akun sedang habis atau semua slot penuh. Hubungi admin.',
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
          account_id: chosenAccount.id,
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

      // 6. Mark voucher as USED & Generate Access Token
      const accessToken = crypto.randomUUID();
      await voucher.update({ 
        status: 'USED', 
        used_at: new Date(),
        access_token: accessToken,
        access_count_today: 0,
        last_access_at: new Date(),
      }, { transaction });

      await transaction.commit();

      // 7. Send WA notification (non-blocking)
      const accountEmail = (chosenAccount as any).email?.email ?? '';
      const accountPassword = chosenAccount.account_password;
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
        variant.redeem_display_config,
        chosenProfile.metadata ? JSON.parse(chosenProfile.metadata) : {},
      ).catch(() => {});

      return {
        voucher_code: dto.voucher_code,
        email: accountEmail,
        password: accountPassword,
        profile_name: profileName,
        expired_at: expiredAt,
        copy_template: copyTemplate,
        access_token: voucher.access_token,
        tenant_id: tenantId,
        metadata: chosenProfile.metadata ? JSON.parse(chosenProfile.metadata) : {},
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
        const accounts = await this.accountRepository.findAll({
          where: {
            product_variant_id: variant.id,
            status: { [Op.ne]: 'disable' },
            subscription_expiry: { [Op.gt]: new Date() },
            freeze_until: null,
          },
          include: [{ model: AccountProfile, as: 'profile', where: { allow_generate: true } }],
          transaction,
        });

        let totalAvailableSlots = 0;
        for (const account of accounts) {
          const profiles = (account as any).profile || [];
          for (const profile of profiles) {
            const activeUsers = await this.accountUserRepository.count({
              where: { account_profile_id: profile.id, status: 'active' },
              transaction,
            });
            const available = profile.max_user - activeUsers;
            if (available > 0) {
              totalAvailableSlots += available;
            }
          }
        }

        result.push({
          product_variant_id: variant.id,
          product_name: (variant as any).product?.name ?? '',
          variant_name: variant.name,
          stock: totalAvailableSlots,
          low_stock: totalAvailableSlots <= threshold,
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
    displayConfig?: any,
    metadata?: any,
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

    const showEmail = displayConfig?.show_email ?? true;
    const showPassword = displayConfig?.show_password ?? true;
    const showProfile = displayConfig?.show_profile_name ?? true;
    const showExpired = displayConfig?.show_expired_at ?? true;
    const customFields = displayConfig?.custom_fields ?? [];

    const resolve = (val: string) => {
      let resolved = val
        .replace('$$email', accountEmail)
        .replace('$$password', accountPassword)
        .replace('$$profile', profileName)
        .replace('$$expired', expiredStr);
      
      if (metadata) {
        Object.entries(metadata).forEach(([key, value]) => {
          resolved = resolved.replace(`$$metadata.${key}`, String(value));
        });
      }
      return resolved;
    };

    const bodyText = copyTemplate
      ? copyTemplate
          .replace('{buyer_name}', buyerName)
          .replace('{email}', accountEmail)
          .replace('{password}', accountPassword)
          .replace('{profile}', profileName)
          .replace('{expired_at}', expiredStr)
          .replace('{voucher_code}', voucherCode)
      : `Halo ${buyerName}! 🎉\n\nVoucher kamu berhasil diredeem!\n\n${showEmail ? `📧 Email: ${accountEmail}\n` : ''}${showPassword ? `🔑 Password: ${accountPassword}\n` : ''}${showProfile ? `👤 Profile: ${profileName}\n` : ''}${showExpired ? `📅 Aktif hingga: ${expiredStr}\n` : ''}${customFields.map((f: any) => `${f.label}: ${resolve(f.value)}\n`).join('')}\nKode Voucher: ${voucherCode}\n\nTerima kasih! 🙏`;

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
          ${showEmail ? `<p style="margin: 5px 0;">📧 <strong>Email:</strong> ${accountEmail}</p>` : ''}
          ${showPassword ? `<p style="margin: 5px 0;">🔑 <strong>Password:</strong> ${accountPassword}</p>` : ''}
          ${showProfile ? `<p style="margin: 5px 0;">👤 <strong>Profile:</strong> ${profileName}</p>` : ''}
          ${showExpired ? `<p style="margin: 5px 0;">📅 <strong>Aktif hingga:</strong> ${expiredStr}</p>` : ''}
          ${customFields.map((f: any) => `<p style="margin: 5px 0;"><strong>${f.label}:</strong> ${resolve(f.value)}</p>`).join('')}
        </div>
        <p>Kode Voucher: <code>${voucherCode}</code></p>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">Terima kasih telah berlangganan di Volve Capital!</p>
      </div>`,
    });
  }

  // ─── SEND PAYMENT CONFIRMATION EMAIL ───────────────────────────────────────

  private async sendPaymentConfirmationEmail(
    email: string,
    buyerName: string,
    voucherCode: string,
    productName: string,
  ): Promise<void> {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const from = this.configService.get<string>('mail.from');

    if (!host || !user || !pass) {
      console.warn(`[Email] Missing configuration (host:${!!host}, user:${!!user}, pass:${!!pass})`);
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Volve Capital" <${from}>`,
      to: email,
      subject: `Pembayaran Berhasil! Kode Voucher: ${voucherCode}`,
      text: `Halo ${buyerName}! 🎉\n\nPembayaran kamu untuk ${productName} telah berhasil dikonfirmasi.\n\nBerikut adalah kode voucher kamu:\n${voucherCode}\n\nSilakan gunakan kode ini untuk aktivasi akun kamu di website kami.\n\nTerima kasih! 🙏`,
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4CAF50;">Pembayaran Berhasil! 🎉</h2>
        <p>Halo <strong>${buyerName}</strong>,</p>
        <p>Terima kasih telah melakukan pembelian di Volve Capital. Pembayaran untuk <strong>${productName}</strong> telah kami terima.</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
          <p style="margin: 5px 0;">Kode Voucher Anda:</p>
          <h1 style="color: #FFB800; margin: 10px 0; letter-spacing: 2px;">${voucherCode}</h1>
        </div>
        <p>Silakan gunakan kode di atas untuk melakukan aktivasi akun Anda melalui halaman redeem kami.</p>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">Jika Anda membutuhkan bantuan, silakan hubungi admin kami.</p>
      </div>`,
    });
  }

  // ─── SEND INVOICE EMAIL ────────────────────────────────────────────────────

  private async sendInvoiceEmail(
    email: string,
    buyerName: string,
    paymentUrl: string,
    productName: string,
    amount: number,
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

    const amountFormatted = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);

    await transporter.sendMail({
      from: `"Volve Capital" <${from}>`,
      to: email,
      subject: `Invoice Pembayaran ${productName}`,
      text: `Halo ${buyerName}! 👋\n\nTerima kasih telah memesan ${productName}.\n\nTotal Pembayaran: ${amountFormatted}\n\nSilakan selesaikan pembayaran melalui link berikut:\n${paymentUrl}\n\nLink ini akan kadaluarsa dalam 24 jam.\n\nTerima kasih! 🙏`,
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #2196F3;">Invoice Pembayaran 👋</h2>
        <p>Halo <strong>${buyerName}</strong>,</p>
        <p>Terima kasih telah melakukan pemesanan di Volve Capital. Berikut adalah detail pesanan Anda:</p>
        <div style="background: #f4f4f4; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <p style="margin: 5px 0;">📦 <strong>Produk:</strong> ${productName}</p>
          <p style="margin: 5px 0;">💰 <strong>Total:</strong> ${amountFormatted}</p>
        </div>
        <p>Silakan klik tombol di bawah ini untuk menyelesaikan pembayaran Anda:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentUrl}" style="background: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Bayar Sekarang</a>
        </div>
        <p style="font-size: 13px; color: #777;">Atau salin link berikut ke browser Anda:<br><code>${paymentUrl}</code></p>
        <p style="font-size: 12px; color: #777; margin-top: 30px;">Jika Anda sudah membayar, silakan abaikan email ini.</p>
      </div>`,
    });
  }

  // ─── GET EMAIL ACCESS FOR BUYER ─────────────────────────────────────────────

  async getEmailAccess(tenantId: string, token: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Find voucher by token
      const voucher = await this.voucherRepository.findOne({
        where: { access_token: token },
        include: [
          {
            model: TransactionItem,
            as: 'transaction_item',
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
                  {
                    model: AccountProfile,
                    as: 'profile',
                  },
                ],
              },
            ],
          },
        ],
        transaction,
      });

      if (!voucher) throw new NotFoundException('Token akses tidak valid');
      if (voucher.status !== 'USED') throw new BadRequestException('Voucher belum di-redeem');

      const user = (voucher.transaction_item as any)?.user;
      if (!user) throw new NotFoundException('Data akun tidak ditemukan');

      // 2. Check Expiry (Strict)
      if (user.expired_at && new Date() > user.expired_at) {
        throw new BadRequestException('Masa aktif voucher sudah habis. Akses ditutup.');
      }

      // 3. Check Daily Limit
      const limitSetting = await this.tenantSettingRepository.findOne({
        where: { key: 'BUYER_PORTAL_DAILY_LIMIT' },
        transaction,
      });
      const MAX_ACCESS = limitSetting ? parseInt(limitSetting.value, 10) : 10;

      const now = new Date();
      const lastAccess = voucher.last_access_at ? new Date(voucher.last_access_at) : null;
      const isSameDay = lastAccess && 
        lastAccess.getDate() === now.getDate() && 
        lastAccess.getMonth() === now.getMonth() && 
        lastAccess.getFullYear() === now.getFullYear();

      if (isSameDay) {
        if (voucher.access_count_today >= MAX_ACCESS) {
          throw new BadRequestException(`Batas akses harian (${MAX_ACCESS}x) tercapai. Silakan coba lagi besok.`);
        }
        await voucher.update({ 
          access_count_today: voucher.access_count_today + 1,
          last_access_at: now 
        }, { transaction });
      } else {
        await voucher.update({ 
          access_count_today: 1, 
          last_access_at: now 
        }, { transaction });
      }

      // 4. Get Allowed Subjects (is_public = true)
      await this.postgresProvider.setSchema('master', transaction);
      const publicSubjects = await this.emailSubjectRepository.findAll({
        where: { is_public: true },
        transaction,
      });
      const allowedContexts = publicSubjects.map(s => s.context);

      // 5. Fetch Messages
      await this.postgresProvider.setSchema(tenantId, transaction);
      const accountEmail = user.account?.email?.email;
      if (!accountEmail) throw new NotFoundException('Email akun tidak ditemukan');

      const messages = await this.emailMessageRepository.findAll({
        where: {
          recipient_email: accountEmail,
          parsed_context: { [Op.in]: allowedContexts },
        },
        order: [['email_date', 'DESC']],
        limit: 20,
        transaction,
      });

      await transaction.commit();

      return {
        account: {
          email: accountEmail,
          profile_name: user.profile?.name,
          expired_at: user.expired_at,
        },
        messages,
        limit: {
          remaining: MAX_ACCESS - (isSameDay ? voucher.access_count_today + 1 : 1),
          total: MAX_ACCESS
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
