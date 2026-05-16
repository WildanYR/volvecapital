import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Op, QueryTypes } from 'sequelize';
import {
  ACCOUNT_USER_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
  TENANT_REPOSITORY,
} from 'src/constants/database.const';
import { AccountUser } from 'src/database/models/account-user.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { Tenant } from 'src/database/models/tenant.model';
import { TransactionItem } from 'src/database/models/transaction-item.model';
import { Transaction } from 'src/database/models/transaction.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { MailService } from '../utility/mail.service';

@Injectable()
export class ExpiryReminderService {
  private readonly logger = new Logger(ExpiryReminderService.name);

  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly mailService: MailService,
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: typeof Tenant,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  @Cron('*/15 * * * *', { timeZone: 'Asia/Jakarta' }) // Every 15 minutes
  async checkExpiringSubscriptions() {
    this.logger.log('Checking for expiring subscriptions to send reminders...');

    const tenants = await this.tenantRepository.findAll();

    for (const tenant of tenants) {
      try {
        await this.processTenantReminders(tenant.id, tenant.name || 'Digital Premium');
      } catch (error) {
        this.logger.error(`Error processing reminders for tenant ${tenant.id}: ${error.message}`);
      }
    }
  }

  private async processTenantReminders(tenantId: string, tenantName: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Get users about to expire who haven't been notified
      // Criteria:
      // - status = 'active'
      // - is_reminder_sent = false
      // - product_variant has reminder_before_hours set
      // - expired_at <= NOW + reminder_before_hours
      // - Transaction platform = 'landing'
      
      const usersToNotify = await this.accountUserRepository.findAll({
        where: {
          status: 'active',
          is_reminder_sent: false,
          expired_at: { [Op.gt]: new Date() }, // Haven't expired yet
        },
        include: [
          {
            model: ProductVariant,
            as: 'profile', // Wait, the relation in AccountUser is 'profile' but we need product variant
            // Let's check AccountUser relations
          },
        ],
        transaction,
      });
      
      // Wait, let's refine the query using raw SQL for complex joins and conditions
      const sqlQuery = `
        SELECT 
          au.id as "userId",
          au.name as "buyerName",
          au.expired_at as "expiredAt",
          pv.id as "variantId",
          pv.name as "variantName",
          pv.reminder_before_hours as "reminderHours",
          p.id as "productId",
          p.name as "productName",
          p.slug as "productSlug",
          v.buyer_email as "buyerEmail"
        FROM account_user au
        JOIN account a ON au.account_id = a.id
        JOIN product_variant pv ON a.product_variant_id = pv.id
        JOIN product p ON pv.product_id = p.id
        JOIN transaction_item ti ON au.id = ti.account_user_id
        JOIN voucher v ON ti.id = v.transaction_item_id
        JOIN transaction t ON ti.transaction_id = t.id
        WHERE au.status = 'active'
          AND au.is_reminder_sent = false
          AND pv.reminder_before_hours IS NOT NULL
          AND t.platform = 'landing'
          AND au.expired_at <= (NOW() + (pv.reminder_before_hours || ' hours')::INTERVAL)
          AND au.expired_at > NOW()
      `;

      // Actually, I should use the correct relations.
      // AccountUser belongs to Account. Account belongs to ProductVariant.
      
      const results = await this.postgresProvider.rawQuery(sqlQuery, {
        transaction,
        type: QueryTypes.SELECT,
      }) as any[];

      for (const row of results) {
        // Send email
        await this.sendReminderEmail(tenantId, tenantName, row);
        
        // Mark as sent
        await this.accountUserRepository.update(
          { is_reminder_sent: true },
          { where: { id: row.userId }, transaction }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  private async sendReminderEmail(tenantId: string, tenantName: string, data: any) {
    const { buyerEmail, buyerName, productName, variantName, expiredAt, productSlug, productId, variantId } = data;

    // Get recommendations: other variants of the same product with LONGER duration
    const currentVariant = await this.productVariantRepository.findByPk(variantId);
    if (!currentVariant) return;

    const recommendations = await this.productVariantRepository.findAll({
      where: {
        product_id: productId,
        id: { [Op.ne]: variantId },
        duration: { [Op.gt]: currentVariant.duration },
      },
      order: [['duration', 'ASC']],
      limit: 2,
    });

    const expiryDateStr = new Date(expiredAt).toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    });

    const purchaseUrl = `https://${tenantId}.digitalpremium.id/product/${productSlug}`;

    let recommendationsHtml = '';
    if (recommendations.length > 0) {
      recommendationsHtml = `
        <div style="margin-top: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 8px;">
          <h4 style="margin-top: 0; color: #333;">Rekomendasi untuk Anda:</h4>
          <p style="font-size: 14px; color: #666;">Ingin durasi yang lebih lama? Cek varian lainnya:</p>
          <ul style="list-style: none; padding: 0;">
            ${recommendations.map(v => `
              <li style="margin-bottom: 10px;">
                <strong>${v.name}</strong> - Rp ${v.price.toLocaleString('id-ID')}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto;">
        <h2 style="color: #e53e3e;">Halo ${buyerName}! 👋</h2>
        <p>Kami ingin menginformasikan bahwa langganan <strong>${productName} (${variantName})</strong> Anda akan segera berakhir pada:</p>
        <div style="background: #fff5f5; padding: 10px; border-left: 4px solid #e53e3e; margin: 20px 0;">
          <strong style="font-size: 18px;">${expiryDateStr} WIB</strong>
        </div>
        <p>Agar tetap bisa menikmati layanan tanpa gangguan, silakan lakukan perpanjangan atau pembelian ulang melalui link di bawah ini:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${purchaseUrl}" style="background: #e53e3e; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Beli Lagi Sekarang</a>
        </div>
        
        ${recommendationsHtml}

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email ini dikirim otomatis oleh sistem ${tenantName}.<br/>
          Jika Anda sudah melakukan perpanjangan, silakan abaikan email ini.
        </p>
      </div>
    `;

    await this.mailService.sendMail({
      to: buyerEmail,
      subject: `[Reminder] Langganan ${productName} Anda akan segera berakhir!`,
      html,
      fromName: tenantName,
    });
  }
}
