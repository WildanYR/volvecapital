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
  TUTORIAL_REPOSITORY,
  TENANT_OWNER_REPOSITORY,
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
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { Tenant } from 'src/database/models/tenant.model';
import { Tutorial } from 'src/database/models/tutorial.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { TenantProvisioningService } from '../tenant/tenant-provisioning.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
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
    @Inject(TUTORIAL_REPOSITORY)
    private readonly tutorialRepository: typeof Tutorial,
    @Inject(TENANT_OWNER_REPOSITORY)
    private readonly tenantOwnerRepository: typeof TenantOwner,
    private readonly tenantProvisioningService: TenantProvisioningService,
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

  // ─── REGISTER TENANT ────────────────────────────────────────────────────────

  async registerTenant(dto: RegisterTenantDto) {
    if (dto.password !== dto.confirm_password) {
      throw new BadRequestException('Konfirmasi password tidak cocok');
    }

    const tenant = await this.tenantProvisioningService.provision({
      username: dto.username,
      email: dto.email,
      password: dto.password,
    });

    // Send verification email (simulated for now, can be real later)
    await this.sendWelcomeEmail(dto.email, dto.username);

    return {
      message: 'Registrasi berhasil! Silakan cek email Anda untuk konfirmasi.',
      tenant_id: tenant.id,
    };
  }

  private async sendWelcomeEmail(email: string, username: string) {
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

    await transporter.sendMail({
      from: `"Volve Capital" <${from}>`,
      to: email,
      subject: 'Selamat Datang di Volve Capital!',
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Halo ${username}! 👋</h2>
        <p>Terima kasih telah mendaftar di Volve Capital. Akun Anda telah berhasil dibuat.</p>
        <p>Anda sekarang dapat login ke dashboard menggunakan email dan password yang telah Anda buat.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${this.configService.get('FRONTEND_URL')}/login" style="background: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Login ke Dashboard</a>
        </div>
      </div>`,
    });
  }

  async forgotPassword(email: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const owner = await this.tenantOwnerRepository.findOne({
        where: { email },
        include: [{ model: Tenant, as: 'tenant' }],
        transaction,
      });

      if (!owner) {
        // We return success even if user not found for security (avoid enumeration)
        return { message: 'Jika email Anda terdaftar, Anda akan menerima link reset password.' };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // 1 hour expiry

      await owner.update({
        reset_token: token,
        reset_expires: expires,
      }, { transaction });

      await this.sendResetPasswordEmail(email, owner.tenant?.name || 'Owner', token);

      await transaction.commit();
      return { message: 'Jika email Anda terdaftar, Anda akan menerima link reset password.' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async resetPassword(token: string, password: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const owner = await this.tenantOwnerRepository.findOne({
        where: {
          reset_token: token,
          reset_expires: { [Op.gt]: new Date() },
        },
        transaction,
      });

      if (!owner) {
        throw new BadRequestException('Token tidak valid atau sudah kadaluarsa');
      }

      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      await owner.update({
        password: hashedPassword,
        reset_token: null,
        reset_expires: null,
      }, { transaction });

      await transaction.commit();
      return { message: 'Password Anda berhasil diperbarui. Silakan login kembali.' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async sendResetPasswordEmail(email: string, name: string, token: string) {
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

    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Volve Capital" <${from}>`,
      to: email,
      subject: 'Reset Password Volve Capital',
      html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <h2>Halo ${name}!</h2>
        <p>Anda menerima email ini karena kami menerima permintaan reset password untuk akun Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk mereset password Anda. Link ini akan kadaluarsa dalam 1 jam.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #f44336; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Jika Anda tidak merasa meminta reset password, silakan abaikan email ini.</p>
      </div>`,
    });
  }

  // ─── LIST PRODUCTS ──────────────────────────────────────────────────────────

  async getProducts(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const products = await this.productRepository.findAll({
        include: [{ model: ProductVariant, as: 'variants' }],
        order: [['created_at', 'ASC']],
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

  // ─── CREATE PAYMENT ─────────────────────────────────────────────────────────

  async createPayment(tenantId: string, dto: CreatePaymentDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Get variant
      const variant = await this.productVariantRepository.findByPk(
        dto.product_variant_id,
        {
          include: [{ model: Product, as: 'product' }],
          transaction,
        },
      );
      if (!variant) throw new NotFoundException('Varian produk tidak ditemukan');

      // 2. Check stock
      const stockStatus = await this.getStockStatus(tenantId);
      const variantStock = stockStatus.find(s => s.variant_id === variant.id);
      if (!variantStock || variantStock.available <= 0) {
        throw new ServiceUnavailableException('Stok untuk varian ini sedang habis');
      }

      // 3. Create order record (Payment Status: PENDING)
      const orderId = `VC-${tenantId.toUpperCase()}-${Date.now()}`;
      const grossAmount = variant.price;

      // Build DOKU callback URL with tenant subdomain
      let frontendBaseUrl = this.configService.get<string>('FRONTEND_URL') || 'localhost:3001';

      // Ensure protocol exists
      if (!frontendBaseUrl.startsWith('http')) {
        frontendBaseUrl = `https://${frontendBaseUrl}`;
      }

      let callbackUrl = '';
      try {
        const url = new URL(frontendBaseUrl);
        const hostname = url.hostname;

        // Prepend tenantId if not already present
        if (!hostname.startsWith(`${tenantId}.`)) {
          url.hostname = `${tenantId}.${hostname}`;
        }

        callbackUrl = `${url.toString().replace(/\/$/, '')}/success?order_id=${orderId}`;
      }
      catch (e) {
        // Fallback for malformed URLs
        const cleanBase = frontendBaseUrl.replace('https://', '').replace('http://', '');
        callbackUrl = `https://${tenantId}.${cleanBase}/success?order_id=${orderId}`;
      }

      const dokuPayload = {
        order: {
          invoice_number: orderId,
          amount: grossAmount,
          currency: 'IDR',
          callback_url: callbackUrl,
        },
        customer: {
          name: dto.buyer_name,
          email: dto.buyer_email,
        },
      };

      const { payment_url } = await this.requestDokuCheckout(dokuPayload);

      // 4. Create voucher record (PENDING)
      // Expiration: 24 hours from now
      const voucherExpiry = new Date();
      voucherExpiry.setHours(voucherExpiry.getHours() + 24);

      await this.voucherRepository.create(
        {
          id: `VC-${Date.now().toString(36).toUpperCase()}`, 
          buyer_name: dto.buyer_name,
          buyer_email: dto.buyer_email,
          buyer_whatsapp: dto.buyer_whatsapp,
          product_variant_id: variant.id,
          payment_id: orderId,
          payment_status: 'PENDING',
          status: 'UNUSED',
          expired_at: voucherExpiry,
        },
        { transaction },
      );

      // 5. Send invoice email (non-blocking)
      this.sendInvoiceEmail(
        dto.buyer_email,
        dto.buyer_name,
        payment_url, 
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
      await this.transactionItemRepository.create(
        {
          name: `${(variant as any).product?.name ?? 'Produk'} - ${variant.name}`,
          transaction_id: txn.id,
        },
        { transaction },
      );

      await transaction.commit();

      return {
        order_id: orderId,
        payment_url,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── DOKU API UTILS ──────────────────────────────────────────────────────────

  private async requestDokuCheckout(payload: any): Promise<{ payment_url: string }> {
    const clientId = this.configService.get<string>('doku.clientId');
    const secretKey = this.configService.get<string>('doku.secretKey') || '';
    const isProd = this.configService.get<boolean>('doku.isProduction');
    
    const baseUrl = isProd ? 'api.doku.com' : 'api-sandbox.doku.com';
    const targetPath = '/checkout/v1/payment';
    const requestId = `REQ-${Date.now()}`;
    const timestamp = new Date().toISOString().split('.')[0] + 'Z';

    const fullPayload = {
      ...payload,
      payment: {
        payment_due_date: 60,
        payment_method_types: ['QRIS'],
      },
    };
    
    const body = JSON.stringify(fullPayload);

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
            if (parsed.response?.payment?.url) {
              resolve({ payment_url: parsed.response.payment.url });
            } else {
              reject(new Error(`DOKU Checkout error: ${JSON.stringify(parsed)}`));
            }
          } catch {
            reject(new Error('Failed to parse DOKU Checkout response'));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  // ─── PAYMENT NOTIFY WEBHOOK (DOKU) ───────────────────────────────────────────

  async handlePaymentNotify(tenantId: string, body: any) {
    const { order, transaction } = body;
    const orderId = order?.invoice_number;
    const transactionStatus = transaction?.status;

    const dbTransaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, dbTransaction);

      const voucher = await this.voucherRepository.findOne({
        where: { payment_id: orderId },
        include: [{ model: ProductVariant, as: 'product_variant', include: [{ model: Product, as: 'product' }] }],
        transaction: dbTransaction,
      });
      if (!voucher) {
        await dbTransaction.commit();
        return { ok: true };
      }

      const isPaid = transactionStatus === 'SUCCESS';
      const isExpiredOrFailed = transactionStatus === 'FAILED' || transactionStatus === 'EXPIRED';

      let shouldSendEmail = false;
      if (isPaid && voucher.payment_status !== 'PAID') {
        shouldSendEmail = true;
        await voucher.update({ payment_status: 'PAID' }, { transaction: dbTransaction });
      }
      else if (isExpiredOrFailed) {
        await voucher.update(
          { payment_status: 'FAILED', status: 'EXPIRED' },
          { transaction: dbTransaction },
        );
      }

      await dbTransaction.commit();

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
      await dbTransaction.rollback();
      throw error;
    }
  }

  // ─── CHECK PAYMENT STATUS ────────────────────────────────────────────────────

  async checkPaymentStatus(tenantId: string, orderId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const voucher = await this.voucherRepository.findOne({
        where: { payment_id: orderId },
        transaction,
      });

      if (!voucher) {
        throw new NotFoundException('Pesanan tidak ditemukan');
      }

      await transaction.commit();
      return {
        order_id: orderId,
        payment_status: voucher.payment_status,
        voucher_code: voucher.payment_status === 'PAID' ? voucher.id : null,
      };
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
            include: [
              { model: Product, as: 'product' },
              { model: Tutorial, as: 'tutorial' }
            ],
          },
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

      if (!voucher) {
        throw new NotFoundException('Voucher tidak ditemukan');
      }

      // Ekstrak data akun agar Frontend bisa langsung baca
      const user = (voucher.transaction_item as any)?.user;
      const accountData = user ? {
        email: user.account?.email?.email,
        password: user.account?.account_password,
        profile_name: user.profile?.name,
        expired_at: user.expired_at,
        metadata: (() => {
          try {
            return user.profile?.metadata ? JSON.parse(user.profile.metadata) : {};
          } catch (e) {
            return {};
          }
        })(),
      } : null;

      await transaction.commit();
      return { 
        voucher, 
        account: accountData 
      };
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
        where: { id: dto.voucher_code, status: 'UNUSED', payment_status: 'PAID' },
        include: [{ model: ProductVariant, as: 'product_variant' }],
        transaction,
      });

      if (!voucher) {
        throw new BadRequestException(
          'Voucher tidak valid, sudah digunakan, atau belum dibayar.',
        );
      }

      const variant = voucher.product_variant;
      if (!variant) throw new NotFoundException('Varian produk tidak ditemukan');

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

      const newUser = await this.accountUserRepository.create(
        {
          name: voucher.buyer_name,
          account_id: chosenAccount.id,
          account_profile_id: chosenProfile.id,
          status: 'active',
          expired_at: expiredAt,
        },
        { transaction },
      );

      // 5. Update voucher
      const accessToken = crypto.randomBytes(32).toString('hex');
      await voucher.update(
        {
          status: 'USED',
          access_token: accessToken,
          used_at: new Date(),
        },
        { transaction },
      );

      // 6. Link to transaction_item if possible
      if (voucher.payment_id) {
        const txnItem = await this.transactionItemRepository.findOne({
          where: { transaction_id: voucher.payment_id },
          transaction,
        });
        if (txnItem) {
          await txnItem.update({ account_user_id: newUser.id }, { transaction });
          await voucher.update({ transaction_item_id: txnItem.id }, { transaction });
        }
      }

      await transaction.commit();

      return {
        message: 'Voucher berhasil diredeem!',
        access_token: accessToken,
        expired_at: expiredAt,
        email: (chosenAccount as any).email?.email,
        password: chosenAccount.account_password,
        profile_name: chosenProfile.name,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── STOCK STATUS ───────────────────────────────────────────────────────────

  async getStockStatus(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const variants = await this.productVariantRepository.findAll({ transaction });
      
      const result = await Promise.all(
        variants.map(async (v) => {
          const accounts = await this.accountRepository.findAll({
            where: {
              product_variant_id: v.id,
              status: { [Op.ne]: 'disable' },
              subscription_expiry: { [Op.gt]: new Date() },
              freeze_until: null,
            },
            include: [{ model: AccountProfile, as: 'profile', where: { allow_generate: true } }],
            transaction,
          });

          let availableSlots = 0;
          for (const acc of accounts) {
            const profiles: AccountProfile[] = (acc as any).profile ?? [];
            for (const prof of profiles) {
              const activeUsers = await this.accountUserRepository.count({
                where: { account_profile_id: prof.id, status: 'active' },
                transaction,
              });
              availableSlots += Math.max(0, prof.max_user - activeUsers);
            }
          }

          return {
            variant_id: v.id,
            name: v.name,
            available: availableSlots,
          };
        }),
      );

      await transaction.commit();
      return result;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ─── EMAIL UTILS ─────────────────────────────────────────────────────────────

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

    if (!host || !user || !pass) return;

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
      // 1. Cari Voucher dulu di schema TENANT
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

      if (!voucher) throw new NotFoundException('Akses tidak ditemukan');

      const user = (voucher.transaction_item as any)?.user;
      if (!user) throw new NotFoundException('Data user tidak ditemukan');

      // 2. Security Check (Duration-based)
      // Max 10 minutes session for the tutorial link
      
      // 3. Update access count (Optional but good for stats)
      
      // 2. Pindah ke schema MASTER untuk ambil daftar subjek
      await this.postgresProvider.setSchema('master', transaction);
      const publicSubjects = await this.emailSubjectRepository.findAll({
        where: { is_public: true },
        transaction,
      });
      const allowedContexts = publicSubjects.map(s => s.context);

      // 2. Sekarang baru pindah ke schema TENANT untuk mengambil pesan email-nya
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

      // 4. Fetch Tenant Settings for Limit
      const portalLimitSetting = await this.tenantSettingRepository.findOne({ 
        where: { key: 'BUYER_PORTAL_DAILY_LIMIT' },
        transaction 
      });
      const dailyLimit = portalLimitSetting?.value || '10';

      await transaction.commit();

      return {
        account: {
          email: accountEmail,
          profile_name: user.profile?.name,
          expired_at: user.expired_at,
        },
        messages,
        limit: {
          total: parseInt(dailyLimit),
          remaining: parseInt(dailyLimit),
        }
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getTutorials(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const tutorials = await this.tutorialRepository.findAll({
        attributes: ['id', 'title', 'slug', 'subtitle', 'thumbnail_url', 'created_at'],
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return tutorials;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getTutorialBySlug(tenantId: string, slug: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const tutorial = await this.tutorialRepository.findOne({
        where: { slug },
        transaction,
      });
      if (!tutorial) throw new NotFoundException('Tutorial tidak ditemukan');
      await transaction.commit();
      return tutorial;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
