import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Op, WhereOptions } from 'sequelize';
import { TENANT_REPOSITORY, TENANT_OWNER_REPOSITORY, DEVICE_SESSION_REPOSITORY } from 'src/constants/database.const';
import { DeviceSession } from 'src/database/models/device-session.model';
import { Tenant } from 'src/database/models/tenant.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import * as crypto from 'crypto';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { TokenProvider } from '../utility/token.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ITenantGetFilter } from './filter/tenant-get.filter';

@Injectable()
export class TenantService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly configService: ConfigService,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwnerRepository: typeof TenantOwner,
    @Inject(DEVICE_SESSION_REPOSITORY) private readonly deviceSessionRepository: typeof DeviceSession,
  ) {}

  async findAll(pagination?: BaseGetAllUrlQuery, filter?: ITenantGetFilter) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const { limit, offset, order }
        = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.tenant_id) {
        whereOptions.tenant_id = { [Op.iLike]: `%${filter.tenant_id}%` };
      }

      const tenants = await this.tenantRepository.findAndCountAll({
        where: whereOptions,
        order,
        limit,
        offset,
        transaction,
      });

      await transaction.commit();
      return this.paginationProvider.generatePaginationResponse(
        tenants.rows,
        tenants.count,
        pagination,
      );
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        transaction,
      });

      if (!tenant) {
        throw new NotFoundException(
          `tenant dengan id: ${tenantId} tidak ditemukan`,
        );
      }

      await transaction.commit();
      return tenant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(createTenantDto: CreateTenantDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const newTenant = await this.tenantRepository.create(
        { ...createTenantDto },
        { transaction },
      );
      await transaction.commit();
      return newTenant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, updateTenantDto: UpdateTenantDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        transaction,
      });

      if (!tenant) {
        throw new NotFoundException(
          `tenant dengan id: ${tenantId} tidak ditemukan`,
        );
      }

      await tenant.update({ ...updateTenantDto }, { transaction });
      await transaction.commit();
      return tenant;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        transaction,
      });

      if (!tenant) {
        throw new NotFoundException(
          `tenant dengan id: ${tenantId} tidak ditemukan`,
        );
      }
      await tenant.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async login(loginDto: LoginDto, userAgent: string = 'Unknown', ip: string = 'Unknown') {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const hashedPassword = crypto.createHash('sha256').update(loginDto.password).digest('hex');

      const owner = await this.tenantOwnerRepository.findOne({
        where: {
          email: loginDto.email,
          password: hashedPassword,
        },
        include: [{ model: Tenant, as: 'tenant' }],
        transaction,
      });

      if (!owner) {
        throw new UnauthorizedException('Email atau password salah');
      }

      if (!owner.tenant) {
        throw new UnauthorizedException('Tenant tidak ditemukan');
      }

      const session = await this.deviceSessionRepository.create({
        user_id: owner.id,
        tenant_id: owner.tenant_id,
        user_type: 'TENANT_OWNER',
        device_info: userAgent,
        ip_address: ip,
      }, { transaction });

      const token = await this.tokenProvider.signJwt<IAccessTokenPayload>(
        this.configService.get<string>('token.secret')!,
        {
          id: owner.id,
          tenant_id: owner.tenant_id,
          email: owner.email,
          role: 'TENANT_OWNER',
          session_id: session.id,
        },
      );

      await transaction.commit();
      return {
        id: owner.tenant_id,
        token,
        tenant_name: owner.tenant.name,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changePassword(ownerId: string, data: any, currentSessionId?: string) {
    const { oldPassword, newPassword, logoutAllDevices } = data;
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const owner = await this.tenantOwnerRepository.findByPk(ownerId, { transaction });
      if (!owner) {
        throw new NotFoundException('Owner tidak ditemukan');
      }

      const hashedOld = crypto.createHash('sha256').update(oldPassword).digest('hex');
      if (owner.password !== hashedOld) {
        throw new BadRequestException('Password lama salah');
      }

      const hashedNew = crypto.createHash('sha256').update(newPassword).digest('hex');
      await owner.update({ password: hashedNew }, { transaction });

      if (logoutAllDevices) {
        const whereClause: any = { user_id: owner.id };
        if (currentSessionId) {
          whereClause.id = { [Op.ne]: currentSessionId };
        }
        await this.deviceSessionRepository.update(
          { is_revoked: true },
          { where: whereClause, transaction }
        );
      }

      await transaction.commit();
      return { message: 'Password berhasil diubah' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getDeviceSessions(ownerId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const sessions = await this.deviceSessionRepository.findAll({
        where: { user_id: ownerId, is_revoked: false },
        order: [['last_active_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return sessions;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async revokeDeviceSession(ownerId: string, sessionId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const session = await this.deviceSessionRepository.findOne({
        where: { id: sessionId, user_id: ownerId },
        transaction,
      });

      if (!session) {
        await transaction.rollback();
        throw new NotFoundException('Sesi tidak ditemukan');
      }

      await session.update({ is_revoked: true }, { transaction });

      await transaction.commit();
      return { message: 'Sesi berhasil diakhiri' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllDeviceSessions(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      // Get all sessions from master schema
      await this.postgresProvider.setSchema('master', transaction);
      const sessions = await this.deviceSessionRepository.findAll({
        where: { tenant_id: tenantId, is_revoked: false },
        order: [['last_active_at', 'DESC']],
        transaction,
      });

      // Get tenant owners
      const tenantOwners = await this.tenantOwnerRepository.findAll({
        where: { tenant_id: tenantId },
        attributes: ['id', 'email'],
        include: [{ model: Tenant, as: 'tenant', attributes: ['name'] }],
        transaction,
      });

      // Get dashboard users from tenant schema
      await this.postgresProvider.setSchema(tenantId, transaction);
      const dashboardUsers = await DashboardUser.findAll({
        attributes: ['id', 'name', 'email'],
        transaction,
      });

      await transaction.commit();

      const userMap = new Map();
      for (const owner of tenantOwners) {
        userMap.set(owner.id, { name: owner.tenant?.name || 'Owner', email: owner.email, type: 'Owner' });
      }
      for (const user of dashboardUsers) {
        userMap.set(user.id, { name: user.name, email: user.email, type: 'Staff' });
      }

      return sessions.map(s => {
        const userInfo = userMap.get(s.user_id) || { name: 'Unknown User', type: 'Unknown' };
        return {
          id: s.id,
          user_id: s.user_id,
          user_type: s.user_type,
          owner_name: userInfo.name,
          owner_email: userInfo.email,
          owner_role: userInfo.type,
          device_info: s.device_info,
          ip_address: s.ip_address,
          last_active_at: s.last_active_at,
          createdAt: s.createdAt,
        };
      });
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async revokeAnyDeviceSession(tenantId: string, sessionId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const session = await this.deviceSessionRepository.findOne({
        where: { id: sessionId, tenant_id: tenantId },
        transaction,
      });

      if (!session) {
        await transaction.rollback();
        throw new NotFoundException('Sesi tidak ditemukan');
      }

      await session.update({ is_revoked: true }, { transaction });

      await transaction.commit();
      return { message: 'Sesi berhasil diakhiri' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
