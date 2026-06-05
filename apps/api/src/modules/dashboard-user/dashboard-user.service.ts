import * as crypto from 'crypto';
import { Op } from 'sequelize';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DASHBOARD_USER_REPOSITORY,
  PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  DEVICE_SESSION_REPOSITORY,
  TENANT_REPOSITORY,
  TENANT_OWNER_REPOSITORY,
} from 'src/constants/database.const';
import { DeviceSession } from 'src/database/models/device-session.model';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { Permission } from 'src/database/models/permission.model';
import { Role } from 'src/database/models/role.model';
import { Tenant } from 'src/database/models/tenant.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { TokenProvider } from '../utility/token.provider';
import {
  CreateDashboardUserDto,
  LoginDashboardUserDto,
  UpdateDashboardUserDto,
} from './dto/dashboard-user.dto';

@Injectable()
export class DashboardUserService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly configService: ConfigService,
    @Inject(DASHBOARD_USER_REPOSITORY)
    private readonly dashboardUserRepository: typeof DashboardUser,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: typeof Role,
    @Inject(PERMISSION_REPOSITORY) private readonly permissionRepository: typeof Permission,
    @Inject(DEVICE_SESSION_REPOSITORY) private readonly deviceSessionRepository: typeof DeviceSession,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
    @Inject(TENANT_OWNER_REPOSITORY) private readonly tenantOwnerRepository: typeof TenantOwner,
  ) {}

  async findAll(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const users = await this.dashboardUserRepository.findAll({
        include: [{ model: Role, include: [{ model: Permission, through: { attributes: [] } }] }],
        attributes: { exclude: ['password'] },
        transaction,
      });
      await transaction.commit();
      return users;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(id: string, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const user = await this.dashboardUserRepository.findOne({
        where: { id },
        include: [{ model: Role, include: [{ model: Permission, through: { attributes: [] } }] }],
        attributes: { exclude: ['password'] },
        transaction,
      });
      await transaction.commit();
      if (!user) throw new NotFoundException(`Staff dengan id ${id} tidak ditemukan`);
      return user;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(dto: CreateDashboardUserDto, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const role = await this.roleRepository.findOne({ where: { id: dto.role_id }, transaction });
      if (!role) throw new NotFoundException(`Role tidak ditemukan`);

      const hashedPassword = crypto.createHash('sha256').update(dto.password).digest('hex');
      const user = await this.dashboardUserRepository.create(
        {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role_id: dto.role_id,
        },
        { transaction },
      );
      await transaction.commit();
      return this.findOne(user.id, tenantId);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(id: string, dto: UpdateDashboardUserDto, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const user = await this.dashboardUserRepository.findOne({ where: { id }, transaction });
      if (!user) throw new NotFoundException(`Staff tidak ditemukan`);

      const updateData: any = { ...dto };
      if (dto.password) {
        updateData.password = crypto.createHash('sha256').update(dto.password).digest('hex');
      }
      await user.update(updateData, { transaction });
      await transaction.commit();
      return this.findOne(id, tenantId);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const user = await this.dashboardUserRepository.findByPk(id, {
        transaction,
      });

      if (!user) {
        throw new NotFoundException(`Dashboard user with id ${id} not found`);
      }

      await user.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async changePassword(userId: string, tenantId: string, data: any, currentSessionId?: string) {
    const { oldPassword, newPassword, logoutAllDevices } = data;
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const user = await this.dashboardUserRepository.findByPk(userId, { transaction });
      if (!user) {
        throw new NotFoundException('User tidak ditemukan');
      }

      const hashedOld = crypto.createHash('sha256').update(oldPassword).digest('hex');
      if (user.password !== hashedOld) {
        throw new BadRequestException('Password lama salah');
      }

      const hashedNew = crypto.createHash('sha256').update(newPassword).digest('hex');
      await user.update({ password: hashedNew }, { transaction });

      if (logoutAllDevices) {
        await this.postgresProvider.setSchema('master', transaction);
        const whereClause: any = { user_id: user.id };
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

  async getDeviceSessions(userId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const sessions = await this.deviceSessionRepository.findAll({
        where: { user_id: userId, is_revoked: false },
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

  async revokeDeviceSession(userId: string, sessionId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const session = await this.deviceSessionRepository.findOne({
        where: { id: sessionId, user_id: userId },
        transaction,
      });

      if (!session) {
        await transaction.rollback();
        throw new NotFoundException('Sesi tidak ditemukan');
      }

      await session.update({ is_revoked: true }, { transaction });
      await transaction.commit();
      return { message: 'Sesi berhasil diakhiri' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getAllDeviceSessions(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const sessions = await this.deviceSessionRepository.findAll({
        where: { tenant_id: tenantId, is_revoked: false },
        order: [['last_active_at', 'DESC']],
        transaction,
      });

      const tenantOwners = await this.tenantOwnerRepository.findAll({
        where: { tenant_id: tenantId },
        attributes: ['id', 'email'],
        include: [{ model: Tenant, as: 'tenant', attributes: ['name'] }],
        transaction,
      });

      await this.postgresProvider.setSchema(tenantId, transaction);
      const dashboardUsers = await this.dashboardUserRepository.findAll({
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

  async login(dto: LoginDashboardUserDto, tenantId: string, userAgent: string = 'Unknown', ip: string = 'Unknown') {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      let user;
      try {
        user = await this.dashboardUserRepository.findOne({
          where: { email: dto.email, is_active: true },
          include: [
            {
              model: Role,
              include: [{ model: Permission, through: { attributes: [] } }],
            },
          ],
          transaction,
        });
      } catch (err: any) {
        if (err.name === 'SequelizeDatabaseError') {
          throw new UnauthorizedException('Tenant salah');
        }
        throw err;
      }

      if (!user) {
        throw new UnauthorizedException('Email tidak terdaftar');
      }

      const hashedPassword = crypto.createHash('sha256').update(dto.password).digest('hex');
      if (user.password !== hashedPassword) {
        throw new UnauthorizedException('Password salah');
      }

      if (!user.role) {
        throw new BadRequestException('Staff tidak memiliki role');
      }

      await this.postgresProvider.setSchema('master', transaction);
      const session = await this.deviceSessionRepository.create({
        user_id: user.id,
        tenant_id: tenantId,
        user_type: 'DASHBOARD_USER',
        device_info: userAgent,
        ip_address: ip,
      }, { transaction });

      await transaction.commit();

      const permissions = (user.role.permissions ?? []).map(p => p.name);

      const token = await this.tokenProvider.signJwt<IAccessTokenPayload>(
        this.configService.get<string>('token.secret')!,
        {
          id: user.id,
          tenant_id: tenantId,
          email: user.email,
          role: 'DASHBOARD_USER',
          permissions,
          session_id: session.id,
        },
      );

      return {
        id: tenantId,
        userId: user.id,
        token,
        name: user.name,
        role: user.role.name,
        permissions,
        session_id: session.id,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMe(id: string, tenantId: string, sessionId?: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const user = await this.dashboardUserRepository.findOne({
        where: { id, is_active: true },
        include: [
          {
            model: Role,
            include: [{ model: Permission, through: { attributes: [] } }],
          },
        ],
        transaction,
      });

      await transaction.commit();

      if (!user) {
        throw new UnauthorizedException('Akun staff tidak ditemukan atau tidak aktif');
      }

      if (!user.role) {
        throw new BadRequestException('Staff tidak memiliki role');
      }

      const permissions = (user.role.permissions ?? []).map(p => p.name);

      const token = await this.tokenProvider.signJwt<IAccessTokenPayload>(
        this.configService.get<string>('token.secret')!,
        {
          id: user.id,
          tenant_id: tenantId,
          email: user.email,
          role: 'DASHBOARD_USER',
          permissions,
          session_id: sessionId,
        },
      );

      return {
        id: tenantId,
        userId: user.id,
        token,
        name: user.name,
        role: user.role.name,
        permissions,
        session_id: sessionId,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
