import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Op, Order, QueryTypes, WhereOptions } from 'sequelize';
import {
  ACCOUNT_MODIFIER_REPOSITORY,
  ACCOUNT_PROFILE_REPOSITORY,
  ACCOUNT_REPOSITORY,
  ACCOUNT_USER_REPOSITORY,
  ACCOUNT_CAPITAL_REPOSITORY,
  PRODUCT_VARIANT_REPOSITORY,
} from 'src/constants/database.const';
import {
  NETFLIX_RESET_PASSWORD,
  NETFLIX_AUTO_RELOAD,
  UNFREEZE_ACCOUNT,
} from 'src/constants/task.const';
import { AccountModifier } from 'src/database/models/account-modifier.model';
import { AccountProfile } from 'src/database/models/account-profile.model';
import { AccountUser } from 'src/database/models/account-user.model';
import {
  Account,
  AccountCreationAttributes,
} from 'src/database/models/account.model';
import { AccountCapital } from 'src/database/models/account-capital.model';
import { Email } from 'src/database/models/email.model';
import { ProductVariant } from 'src/database/models/product-variant.model';
import { Product } from 'src/database/models/product.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { UpsertTaskQueueDto } from '../task-queue/dto/upsert-task-queue.dto';
import { TaskQueueService } from '../task-queue/task-queue.service';
import { AccountSubsEndNotifyPayload, NetflixAutoReloadPayload, NetflixResetPasswordPayload } from '../task-queue/types/task-context.type';
import { DateConverterProvider } from '../utility/date-converter.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateAccountDto } from './dto/create-account.dto';
import { FreezeAccountDto } from './dto/freeze-account.dto';
import { UpdateAccountModifierDto } from './dto/update-account-modifier.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { IAccountGetFilter } from './filter/account-get.filter';
import { ModifierTaskData } from './types/modifier-task-data.type';
import { NetflixResetPasswordMetadata } from './types/netflix-reset-password-metadata.type';
import { SubsEndNotifyMetadata } from './types/subs-end-notify-metadata.type';

@Injectable()
export class AccountService {
  // In-memory store for pending topup requests (auto-cleared after 15 min)
  private pendingTopupStore: Map<string, { accountId: string; email: string; billing: string; taskId: string; tenantId: string; createdAt: Date }> = new Map();

  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly dateConverterProvider: DateConverterProvider,
    private readonly postgresProvider: PostgresProvider,
    private readonly taskQueueService: TaskQueueService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: typeof Account,
    @Inject(ACCOUNT_PROFILE_REPOSITORY)
    private readonly accountProfileRepository: typeof AccountProfile,
    @Inject(ACCOUNT_MODIFIER_REPOSITORY)
    private readonly accountModifierRepository: typeof AccountModifier,
    @Inject(ACCOUNT_USER_REPOSITORY)
    private readonly accountUserRepository: typeof AccountUser,
    @Inject(ACCOUNT_CAPITAL_REPOSITORY)
    private readonly accountCapitalRepository: typeof AccountCapital,
    @Inject(PRODUCT_VARIANT_REPOSITORY)
    private readonly productVariantRepository: typeof ProductVariant,
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IAccountGetFilter,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.email_id) {
        whereOptions.email_id = filter.email_id;
      }
      if (filter?.status) {
        whereOptions.status = filter.status;
      }
      if (filter?.billing) {
        whereOptions.billing = { [Op.iLike]: `%${filter.billing}%` };
      }

      const orderOptions: Order = order?.length
        ? order.map((o) => {
            if (o[0] === 'id') {
              return ['updated_at', 'DESC'];
            }
            if (typeof o[0] === 'string' && o[0].includes('.')) {
              const [table, attribute] = o[0].split('.');
              if (table === 'email') {
                return [{ model: Email, as: 'email' }, attribute, o[1]];
              }
            }
            return o;
          })
        : [];

      const includeOptions = [
        {
          model: Email,
          as: 'email',
          where: filter?.email
            ? { email: { [Op.iLike]: `%${filter.email}%` } }
            : undefined,
        },
        {
          model: ProductVariant,
          as: 'product_variant',
          where: {
            ...(filter?.product_variant_id && { id: filter.product_variant_id }),
            ...(filter?.product_id && { product_id: filter.product_id }),
          },
          include: [
            {
              model: Product,
              as: 'product',
              where: {
                ...(filter?.product_slug && { slug: filter.product_slug }),
              },
              required: !!filter?.product_slug,
            },
          ],
          required: !!filter?.product_variant_id || !!filter?.product_id || !!filter?.product_slug,
        },
        {
          model: AccountProfile,
          as: 'profile',
          required: !!filter?.user,
          include: [
            {
              model: AccountUser,
              as: 'user',
              where: {
                status: 'active',
                ...(filter?.user && {
                  name: { [Op.iLike]: `%${filter.user}%` },
                }),
              },
              required: !!filter?.user,
            },
          ],
        },
        {
          model: AccountModifier,
          as: 'modifier',
          where: { enabled: true },
          required: false,
        },
      ];

      const accounts = await this.accountRepository.findAll({
        where: whereOptions,
        order: [
          ['pinned', 'DESC'],
          ...orderOptions,
          [{ model: AccountProfile, as: 'profile' }, 'name', 'ASC'],
        ],
        limit,
        offset,
        include: includeOptions,
        transaction,
      });
      const accountCount = await this.accountRepository.count({
        where: whereOptions,
        include: includeOptions,
        distinct: true,
        transaction,
      });

      const accountIds = accounts.map(a => a.id);
      let revenues: any[] = [];
      if (accountIds.length > 0) {
        revenues = await this.postgresProvider.rawQuery(`
          SELECT 
            au.account_id,
            COALESCE(SUM(t.total_price), 0)::INT as total_revenue
          FROM account_user au
          JOIN transaction_item ti ON ti.account_user_id = au.id
          JOIN transaction t ON t.id = ti.transaction_id
          WHERE au.account_id IN (:accountIds)
          GROUP BY au.account_id
        `, {
          replacements: { accountIds },
          type: QueryTypes.SELECT,
          transaction,
        });
      }

      // Fetch Capital Summaries
      let capitals: any[] = [];
      if (accountIds.length > 0) {
        capitals = await this.postgresProvider.rawQuery(`
          SELECT 
            account_id,
            COALESCE(SUM(amount), 0)::INT as total_capital
          FROM account_capital
          WHERE account_id IN (:accountIds)
          GROUP BY account_id
        `, {
          replacements: { accountIds },
          type: QueryTypes.SELECT,
          transaction,
        });
      }

      const accountsWithStats = accounts.map((account) => {
        const revenueData = revenues.find(r => r.account_id === account.id);
        const capitalData = capitals.find(c => c.account_id === account.id);
        
        const totalRevenue = revenueData ? revenueData.total_revenue : 0;
        const totalCapital = account.capital_price + (capitalData ? capitalData.total_capital : 0);
        
        const profit = totalRevenue - totalCapital;
        const roi = totalCapital > 0 ? (profit / totalCapital) * 100 : 0;

        return {
          ...account.get({ plain: true }),
          total_revenue: totalRevenue,
          total_capital: totalCapital,
          profit,
          roi: Number(roi.toFixed(2)),
        };
      });

      await transaction.commit();

      return this.paginationProvider.generatePaginationResponse(
        accountsWithStats,
        accountCount,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, accountId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        include: [
          { model: Email, as: 'email' },
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Product, as: 'product' }],
          },
          {
            model: AccountProfile,
            as: 'profile',
            include: [{ model: AccountUser, as: 'user' }],
          },
          {
            model: AccountModifier,
            as: 'modifier',
            where: { enabled: true },
            required: false,
          },
        ],
        transaction,
      });

      if (!account) {
        throw new NotFoundException(
          `account dengan id: ${accountId} tidak ditemukan`,
        );
      }

      const [revenueResult]: any = await this.postgresProvider.rawQuery(`
        SELECT 
          COALESCE(SUM(t.total_price), 0)::INT as total_revenue
        FROM account_user au
        JOIN transaction_item ti ON ti.account_user_id = au.id
        JOIN transaction t ON t.id = ti.transaction_id
        WHERE au.account_id = :accountId
      `, {
        replacements: { accountId },
        type: QueryTypes.SELECT,
        transaction,
      });

      const [capitalResult]: any = await this.postgresProvider.rawQuery(`
        SELECT 
          COALESCE(SUM(amount), 0)::INT as total_capital
        FROM account_capital
        WHERE account_id = :accountId
      `, {
        replacements: { accountId },
        type: QueryTypes.SELECT,
        transaction,
      });

      const totalRevenue = revenueResult ? (revenueResult as any).total_revenue : 0;
      const totalCapital = account.capital_price + (capitalResult ? (capitalResult as any).total_capital : 0);
      const profit = totalRevenue - totalCapital;
      const roi = totalCapital > 0 ? (profit / totalCapital) * 100 : 0;

      await transaction.commit();

      return {
        ...account.get({ plain: true }),
        total_revenue: totalRevenue,
        total_capital: totalCapital,
        profit,
        roi: Number(roi.toFixed(2)),
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, createAccountDto: CreateAccountDto) {
    const { profile, modifier, ...accountData } = createAccountDto;

    let account: Account | null;
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const existingAccount = await this.accountRepository.count({
        where: {
          email_id: accountData.email_id,
          product_variant_id: accountData.product_variant_id,
        },
        transaction,
      });

      if (existingAccount) {
        throw new BadRequestException(
          'Akun dengan email dan varian produk sudah ada',
        );
      }

      const newAccount = await this.accountRepository.create(accountData, {
        transaction,
      });

      const profileData = profile.map(p => ({
        ...p,
        account_id: newAccount.id,
      }));
      await this.accountProfileRepository.bulkCreate(profileData, {
        transaction,
      });

      if (modifier?.length) {
        const modifierData = modifier.map(mod => ({
          ...mod,
          account_id: newAccount.id,
          enabled: true,
        }));
        await this.accountModifierRepository.bulkCreate(modifierData, {
          transaction,
        });
      }

      account = await this.accountRepository.findOne({
        where: { id: newAccount.id },
        include: [
          { model: Email, as: 'email' },
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Product, as: 'product' }],
          },
          {
            model: AccountProfile,
            as: 'profile',
            include: [{ model: AccountUser, as: 'user' }],
          },
          {
            model: AccountModifier,
            as: 'modifier',
            where: { enabled: true },
            required: false,
          },
        ],
        transaction,
      });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (account && modifier?.length) {
      await this.registerModifierToTaskQueue(
        tenantId,
        account,
        modifier.map(mod => ({ ...mod, modifierId: mod.modifier_id })),
      );
    }

    return account;
  }

  async update(
    tenantId: string,
    accountId: string,
    updateAccountDto: UpdateAccountDto,
  ) {
    let account: Account | null;
    let accountUpdateData: Partial<AccountCreationAttributes>;
    let modifiers: AccountModifier[];
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      account = await this.accountRepository.findOne({
        where: { id: accountId },
        transaction,
      });

      if (!account) {
        throw new NotFoundException(
          `account dengan id: ${accountId} tidak ditemukan`,
        );
      }

      accountUpdateData = {
        ...updateAccountDto,
      };
      if (updateAccountDto.status && updateAccountDto.status !== 'active') {
        await this.accountUserRepository.update(
          { status: 'expired' },
          { where: { account_id: accountId, status: 'active' }, transaction },
        );
        accountUpdateData.batch_start_date = null;
        accountUpdateData.batch_end_date = null;
      }

      if (updateAccountDto.switch_to_harian) {
        const currentAccount = await this.accountRepository.findOne({
          where: { id: accountId },
          include: [{ model: ProductVariant, as: 'product_variant' }],
          transaction,
        });

        if (currentAccount?.product_variant?.product_id) {
          console.log(`[DEBUG] Switching account ${accountId} to Harian. ProductID: ${currentAccount.product_variant.product_id}`);
          
          const harianVariant = await this.productVariantRepository.findOne({
            where: {
              product_id: currentAccount.product_variant.product_id,
              name: { [Op.iLike]: '%Harian%' },
            },
            transaction,
          });

          if (harianVariant) {
            console.log(`[DEBUG] Found Harian variant ID: ${harianVariant.id}`);
            accountUpdateData.product_variant_id = harianVariant.id;
          } else {
            console.log(`[DEBUG] Harian variant NOT FOUND for product ${currentAccount.product_variant.product_id}`);
            
            const allVariants = await this.productVariantRepository.findAll({
                where: { product_id: currentAccount.product_variant.product_id },
                transaction
            });
            console.log(`[DEBUG] Available variants for this product:`, JSON.stringify(allVariants.map(v => ({ id: v.id, name: v.name })), null, 2));
          }
        }
      }

      await account.update(accountUpdateData, { transaction });

      modifiers = await this.accountModifierRepository.findAll({
        where: { account_id: account.id, enabled: true },
        transaction,
      });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (
      modifiers.length
      && (accountUpdateData.batch_end_date
        || accountUpdateData.subscription_expiry)
    ) {
      await this.registerModifierToTaskQueue(
        tenantId,
        account,
        modifiers.map(mod => ({
          modifierId: mod.modifier_id,
          metadata: mod.metadata,
        })),
      );
    }

    return account;
  }

  async updateAccountModifier(
    tenantId: string,
    accountId: string,
    updateAccountModifierDto: UpdateAccountModifierDto,
  ) {
    let account: Account | null;
    const addModifierToTaskQueue: ModifierTaskData[] = [];
    const removedModifierContexts: string[] = [];
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { modifier: modifiers } = updateAccountModifierDto;

      // Ambil semua modifier_id terkait account dalam sekali query
      const modifierIds = modifiers.map(m => m.modifier_id);
      const existingModifiers = await this.accountModifierRepository.findAll({
        where: { account_id: accountId, modifier_id: modifierIds },
        transaction,
      });

      // Buat map untuk akses cepat
      const existingModifierMap = new Map<string, AccountModifier>();

      existingModifiers.forEach((mod) => {
        existingModifierMap.set(mod.dataValues.modifier_id, mod);
      });

      // Jalankan semua update/insert secara paralel
      await Promise.all(
        modifiers.map(async ({ modifier_id, metadata, action }) => {
          const existing = existingModifierMap.get(modifier_id);

          if (action === 'ADD') {
            await this.accountModifierRepository.create(
              {
                account_id: accountId,
                modifier_id,
                metadata: metadata!,
                enabled: true,
              },
              { transaction },
            );
            addModifierToTaskQueue.push({
              modifierId: modifier_id,
              metadata: metadata!,
            });
          }

          if (action === 'UPDATE' && existing) {
            await existing.update({ metadata, enabled: true }, { transaction });
            addModifierToTaskQueue.push({
              modifierId: existing.dataValues.modifier_id,
              metadata: existing.dataValues.metadata,
            });
          }

          if (action === 'REMOVE' && existing) {
            await existing.update({ enabled: false }, { transaction });
            removedModifierContexts.push(existing.dataValues.modifier_id);
          }
        }),
      );

      account = await this.accountRepository.findOne({
        where: { id: accountId },
        include: [
          { model: Email, as: 'email' },
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Product, as: 'product' }],
          },
          {
            model: AccountProfile,
            as: 'profile',
            include: [{ model: AccountUser, as: 'user' }],
          },
          {
            model: AccountModifier,
            as: 'modifier',
            where: { enabled: true },
            required: false,
          },
        ],
        transaction,
      });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (removedModifierContexts.length) {
      await this.taskQueueService.removeByAccount(
        tenantId,
        accountId,
        removedModifierContexts,
      );
    }

    if (addModifierToTaskQueue.length && account) {
      await this.registerModifierToTaskQueue(
        tenantId,
        account,
        addModifierToTaskQueue,
      );
    }
  }

  async remove(tenantId: string, accountId: string) {
    let contexts: string[];
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        include: [{ model: AccountModifier, as: 'modifier' }],
        transaction,
      });

      if (!account) {
        throw new NotFoundException(
          `account dengan id: ${accountId} tidak ditemukan`,
        );
      }

      contexts = account.modifier
        ? account.modifier.map(mod => mod.dataValues.modifier_id)
        : [];

      await account.destroy({ transaction });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }

    if (contexts.length) {
      await this.taskQueueService.removeByAccount(
        tenantId,
        accountId,
        contexts,
      );
    }
  }

  async registerModifierToTaskQueue(
    tenantId: string,
    account: Account,
    modifiers: ModifierTaskData[],
  ) {
    const taskQueueData: UpsertTaskQueueDto[] = [];

    for (const mod of modifiers) {
      if (mod.modifierId === 'SUBS_END_NOTIFY') {
        const metadata = JSON.parse(mod.metadata) as SubsEndNotifyMetadata;
        const dday = new Date(account.dataValues.subscription_expiry);
        dday.setHours(7, 0, 0, 0);

        const minDDay = new Date(account.dataValues.subscription_expiry);
        minDDay.setHours(7, 0, 0, 0);
        minDDay.setDate(minDDay.getDate() - Number.parseInt(metadata.dday));

        const dDayFormatted = this.dateConverterProvider.formatDateIdStandard(
          account.dataValues.subscription_expiry,
          { hideTime: true },
        );

        taskQueueData.push({
          context: mod.modifierId,
          execute_at: dday,
          subject_id: account.id,
          tenant_id: tenantId,
          status: 'QUEUED',
          payload: JSON.stringify({
            context: 'NEED_ACTION',
            tenant_id: tenantId,
            message: `Langganan (Subscription) akun ${account.email.email} [${account.product_variant.product.name}] telah berakhir hari ini ${dDayFormatted}.\n\nSilahkan lakukan tindakan`,
          } as AccountSubsEndNotifyPayload),
        });
        taskQueueData.push({
          context: mod.modifierId,
          execute_at: minDDay,
          subject_id: account.id,
          tenant_id: tenantId,
          status: 'QUEUED',
          payload: JSON.stringify({
            context: 'NEED_ACTION',
            tenant_id: tenantId,
            message: `Langganan (Subscription) akun ${account.email.email} [${account.product_variant.product.name}] akan berakhir ${metadata.dday} hari lagi pada ${dDayFormatted}.\n\nSilahkan lakukan tindakan`,
          } as AccountSubsEndNotifyPayload),
        });
      }

      if (
        mod.modifierId === NETFLIX_RESET_PASSWORD
        && account.dataValues.batch_end_date
      ) {
        const metadata = JSON.parse(
          mod.metadata,
        ) as NetflixResetPasswordMetadata;
        const passwordList = metadata.password_list
          .replaceAll(' ', '')
          .split(',')
          .filter(pwd => pwd !== account.dataValues.account_password);

        const randomIndex = Math.floor(Math.random() * passwordList.length);
        const newPassword = passwordList[randomIndex];

        taskQueueData.push({
          context: mod.modifierId,
          execute_at: account.dataValues.batch_end_date,
          subject_id: account.id,
          tenant_id: tenantId,
          status: 'QUEUED',
          payload: JSON.stringify({
            id: account.id,
            accountId: account.id,
            email: account.email.email,
            password: account.account_password,
            newPassword,
            subscription_expiry: account.dataValues.subscription_expiry?.toISOString?.() || '',
            variant_name: account.product_variant?.dataValues?.name ?? '',
          } as NetflixResetPasswordPayload),
        });
      }
    }
    await this.taskQueueService.upsert(taskQueueData);
  }

  async freezeAccount(
    tenantId: string,
    accountId: string,
    freezeAccountDto: FreezeAccountDto,
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        transaction,
      });
      if (!account) {
        throw new NotFoundException('account not found');
      }
      const dateMs = Date.now() + freezeAccountDto.duration;
      const freezeUntil = new Date(dateMs);
      await account.update({ freeze_until: freezeUntil }, { transaction });
      await this.taskQueueService.upsert([
        {
          context: UNFREEZE_ACCOUNT,
          execute_at: freezeUntil,
          subject_id: account.id,
          tenant_id: tenantId,
          status: 'QUEUED',
          payload: JSON.stringify({ accountId: account.id }),
        },
      ]);
      await transaction.commit();
      return account;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async clearFreezeAccount(tenantId: string, accountId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        transaction,
      });
      if (!account) {
        throw new NotFoundException('account not found');
      }
      await account.update({ freeze_until: null }, { transaction });
      await this.taskQueueService.removeByAccount(tenantId, accountId, [
        UNFREEZE_ACCOUNT,
      ]);
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async countStatusAccount(tenantId: string, filter?: { product_variant_id?: string, product_id?: string, product_slug?: string }) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Setup Dynamic Filter
      const replacements: any = {};
      let accountFilterSql = '';
      let cteFilterSql = '';

      if (filter?.product_variant_id) {
        replacements.variantId = filter.product_variant_id;
        accountFilterSql += ' AND product_variant_id = :variantId';
        cteFilterSql += ' AND a.product_variant_id = :variantId';
      }

      if (filter?.product_id) {
        replacements.productId = filter.product_id;
        accountFilterSql += ' AND product_variant_id IN (SELECT id FROM product_variant WHERE product_id = :productId)';
        cteFilterSql += ' AND a.product_variant_id IN (SELECT id FROM product_variant WHERE product_id = :productId)';
      }

      if (filter?.product_slug) {
        replacements.productSlug = filter.product_slug;
        const subquery = '(SELECT id FROM product_variant WHERE product_id = (SELECT id FROM product WHERE slug = :productSlug))';
        accountFilterSql += ` AND product_variant_id IN ${subquery}`;
        cteFilterSql += ` AND a.product_variant_id IN ${subquery}`;
      }

      // 2. Query Akun Disable/Freeze (Output 4)
      const disabledResult = (await this.postgresProvider.rawQuery(
        `SELECT COUNT(*) as count 
     FROM account 
     WHERE (status = 'disable' OR freeze_until IS NOT NULL)
     ${accountFilterSql}`,
        {
          type: QueryTypes.SELECT,
          replacements,
          plain: true,
          transaction,
        },
      )) as unknown as { count: string };

      const expiringResult = (await this.postgresProvider.rawQuery(
        `SELECT COUNT(*) as count 
     FROM account 
     WHERE (batch_end_date AT TIME ZONE 'Asia/Jakarta')::date = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
     ${accountFilterSql}`,
        {
          type: QueryTypes.SELECT,
          replacements,
          plain: true,
          transaction,
        },
      )) as unknown as { count: string };

      // 3. Query Utama (Output 1, 2, 3, 5)
      const slotStats = (await this.postgresProvider.rawQuery(
        `
        WITH 
        user_counts AS (
            SELECT account_profile_id, COUNT(*) as active_count
            FROM account_user
            WHERE status = 'active'
            GROUP BY account_profile_id
        ),
        
        profile_calc AS (
            SELECT 
                ap.id AS profile_id,
                ap.account_id,
                ap.allow_generate,
                ap.max_user,
                COALESCE(uc.active_count, 0) as current_usage,
                
                -- Logic Akun Valid
                (CASE WHEN a.status != 'disable' AND a.freeze_until IS NULL THEN 1 ELSE 0 END) as is_account_valid,

                -- Logic Slot Kosong
                (CASE WHEN COALESCE(uc.active_count, 0) < ap.max_user THEN 1 ELSE 0 END) as has_slot
            FROM account_profile ap
            JOIN account a ON a.id = ap.account_id
            LEFT JOIN user_counts uc ON uc.account_profile_id = ap.id
            WHERE 1=1 ${cteFilterSql} -- Inject filter variant disini (efisien: filter sebelum grouping)
        ),

        account_agg AS (
            SELECT 
                account_id,
                COUNT(CASE WHEN allow_generate = true AND has_slot = 1 THEN 1 END) as available_gen_profiles,
                COUNT(CASE WHEN allow_generate = true THEN 1 END) as total_gen_profiles
            FROM profile_calc
            WHERE is_account_valid = 1 
            GROUP BY account_id
        )

        SELECT 
            -- Output 3
            (SELECT COUNT(*) FROM profile_calc 
            WHERE is_account_valid = 1 AND allow_generate = true AND has_slot = 1
            )::int as profiles_available,

            -- Output 5
            (SELECT COUNT(*) FROM profile_calc 
            WHERE is_account_valid = 1 AND allow_generate = false AND has_slot = 1
            )::int as profiles_locked,

            -- Output 1
            COUNT(CASE WHEN available_gen_profiles > 0 THEN 1 END)::int as accounts_providing_slots,

            -- Output 2
            COUNT(CASE WHEN total_gen_profiles > 0 AND available_gen_profiles = 0 THEN 1 END)::int as accounts_full

        FROM account_agg;
        `,
        {
          type: QueryTypes.SELECT,
          plain: true,
          replacements,
          transaction,
        },
      )) as unknown as {
        accounts_providing_slots: number;
        accounts_full: number;
        profiles_available: number;
        profiles_locked: number;
      };

      await transaction.commit();
      return {
        accounts_with_slots: slotStats?.accounts_providing_slots || 0,
        accounts_full: slotStats?.accounts_full || 0,
        profiles_available: slotStats?.profiles_available || 0,
        accounts_disabled_or_frozen: Number.parseInt(disabledResult?.count || '0', 10),
        profiles_locked_but_has_slot: slotStats?.profiles_locked || 0,
        accounts_expiring_today: Number.parseInt(expiringResult?.count || '0', 10),
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async addCapital(tenantId: string, accountId: string, data: { amount: number; note?: string }) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const account = await this.accountRepository.findByPk(accountId, { transaction });
      if (!account) {
        throw new NotFoundException(`Account dengan id: ${accountId} tidak ditemukan`);
      }

      const capital = await this.accountCapitalRepository.create(
        {
          account_id: accountId,
          amount: data.amount,
          note: data.note,
        } as any,
        { transaction },
      );

      await transaction.commit();
      return capital;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getFinancialDetails(tenantId: string, accountId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      // 1. Fetch Capitals
      const capitals = await this.accountCapitalRepository.findAll({
        where: { account_id: accountId },
        order: [['created_at', 'DESC']],
        transaction,
      });

      // 2. Fetch Revenue Details
      const revenues = await this.postgresProvider.rawQuery(`
        SELECT 
          t.id as transaction_id,
          t.total_price as amount,
          t.created_at as date,
          au.name as user_name
        FROM account_user au
        JOIN transaction_item ti ON ti.account_user_id = au.id
        JOIN transaction t ON t.id = ti.transaction_id
        WHERE au.account_id = :accountId
        ORDER BY t.created_at DESC
      `, {
        replacements: { accountId },
        type: QueryTypes.SELECT,
        transaction,
      });

      await transaction.commit();
      return {
        capitals,
        revenues,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async triggerReset(tenantId: string, accountId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        include: [
          { model: Email, as: 'email' },
          { model: ProductVariant, as: 'product_variant' },
        ],
        transaction,
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const payload: NetflixResetPasswordPayload = {
        id: Date.now().toString(),
        accountId: account.id,
        email: account.email.email,
        password: account.account_password,
        newPassword: '', // Biarkan Bot yang generate
        subscription_expiry: account.subscription_expiry.toISOString(),
        variant_name: account.product_variant.name,
      };

      const task: UpsertTaskQueueDto = {
        execute_at: new Date(),
        subject_id: account.id,
        context: NETFLIX_RESET_PASSWORD,
        payload: JSON.stringify(payload),
        status: 'QUEUED',
        tenant_id: tenantId,
      };

      await this.taskQueueService.upsert([task]);
      await transaction.commit();

      return { message: 'Reset task triggered successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async triggerReload(tenantId: string, accountId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const account = await this.accountRepository.findOne({
        where: { id: accountId },
        include: [
          { model: Email, as: 'email' },
          { model: ProductVariant, as: 'product_variant' },
        ],
        transaction,
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const payload: NetflixAutoReloadPayload = {
        accountId: account.id,
        email: account.email.email,
        password: account.account_password,
        billing: account.billing ?? '',
        variant_name: account.product_variant.name,
      };

      const task: UpsertTaskQueueDto = {
        execute_at: new Date(),
        subject_id: account.id,
        context: NETFLIX_AUTO_RELOAD,
        payload: JSON.stringify(payload),
        status: 'QUEUED',
        tenant_id: tenantId,
      };

      await this.taskQueueService.upsert([task]);
      await transaction.commit();

      return { message: 'Auto reload task triggered successfully' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  registerPendingTopup(
    tenantId: string,
    accountId: string,
    data: { email: string; billing: string; taskId: string },
  ) {
    // Hapus entri lama yang sudah > 15 menit
    const now = new Date();
    for (const [key, val] of this.pendingTopupStore.entries()) {
      const age = now.getTime() - val.createdAt.getTime();
      if (age > 15 * 60 * 1000) {
        this.pendingTopupStore.delete(key);
      }
    }

    const key = `${tenantId}:${accountId}`;
    this.pendingTopupStore.set(key, {
      accountId,
      email: data.email,
      billing: data.billing,
      taskId: data.taskId,
      tenantId,
      createdAt: new Date(),
    });

    return { message: 'Pending topup registered' };
  }

  getPendingTopups(tenantId: string) {
    try {
      if (!tenantId) {
        return [];
      }

      if (!this.pendingTopupStore) {
        this.pendingTopupStore = new Map();
        return [];
      }

      const results: { accountId: string; email: string; billing: string; taskId: string }[] = [];
      const now = new Date();
      const entries = Array.from(this.pendingTopupStore.entries());

      for (const [key, val] of entries) {
        if (val.tenantId !== tenantId) continue;

        const age = now.getTime() - val.createdAt.getTime();
        if (age > 15 * 60 * 1000) {
          this.pendingTopupStore.delete(key);
          continue;
        }

        results.push({
          accountId: val.accountId,
          email: val.email,
          billing: val.billing,
          taskId: val.taskId,
        });
      }

      return results;
    } catch (error) {
      console.error('[AccountService] Error in getPendingTopups:', error);
      return []; // Return empty instead of crashing
    }
  }

  clearPendingTopup(tenantId: string, accountId: string) {
    const key = `${tenantId}:${accountId}`;
    this.pendingTopupStore.delete(key);
  }

  async bulkAction(
    tenantId: string,
    ids: string[],
    action: 'pin' | 'unpin' | 'freeze' | 'unfreeze' | 'delete' | 'clear' | 'reset_now' | 'auto_reload' | 'enable' | 'disable'
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      switch (action) {
        case 'enable':
          await this.accountRepository.update(
            { status: 'ready', freeze_until: null },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'disable':
          await this.accountRepository.update(
            { status: 'disable' },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'pin':
          await this.accountRepository.update(
            { pinned: true },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'unpin':
          await this.accountRepository.update(
            { pinned: false },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'freeze':
          const freezeUntil = new Date();
          freezeUntil.setDate(freezeUntil.getDate() + 7); // Default 7 hari
          await this.accountRepository.update(
            { status: 'freeze', freeze_until: freezeUntil },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'unfreeze':
          await this.accountRepository.update(
            { status: 'ready', freeze_until: null },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'delete':
          await this.accountRepository.destroy({
            where: { id: { [Op.in]: ids } },
            transaction
          });
          break;
        case 'clear':
          // 1. Hapus semua user yang terhubung ke akun-akun ini
          await this.accountUserRepository.destroy({
            where: { account_id: { [Op.in]: ids } },
            transaction
          });
          // 2. Kosongkan metadata di profil akun
          await this.accountProfileRepository.update(
            { metadata: JSON.stringify([]) },
            { where: { account_id: { [Op.in]: ids } }, transaction }
          );
          // 3. Kembalikan status akun menjadi 'ready'
          await this.accountRepository.update(
            { status: 'ready' },
            { where: { id: { [Op.in]: ids } }, transaction }
          );
          break;
        case 'reset_now':
        case 'auto_reload':
          // Trigger bot tasks for all selected IDs
          const tasks: UpsertTaskQueueDto[] = [];
          const accounts = await this.accountRepository.findAll({
            where: { id: { [Op.in]: ids } },
            include: [
              { model: Email, as: 'email' },
              { model: ProductVariant, as: 'product_variant' }
            ],
            transaction
          });

          for (const account of accounts) {
            const taskType = action === 'reset_now' ? NETFLIX_RESET_PASSWORD : NETFLIX_AUTO_RELOAD;
            const payload = action === 'reset_now' 
              ? { email: account.email?.email || account.email_id, password: account.account_password }
              : { 
                  accountId: account.id, 
                  email: account.email?.email || account.email_id, 
                  password: account.account_password,
                  billing: account.billing,
                  variant_name: account.product_variant?.name || ''
                };

            tasks.push({
              execute_at: new Date(),
              subject_id: account.id,
              context: taskType,
              payload: JSON.stringify(payload),
              status: 'QUEUED',
              tenant_id: tenantId,
            });
          }
          if (tasks.length > 0) {
            await this.taskQueueService.upsert(tasks);
          }
          break;
      }

      await transaction.commit();
      return { message: `Bulk ${action} completed for ${ids.length} accounts` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}


