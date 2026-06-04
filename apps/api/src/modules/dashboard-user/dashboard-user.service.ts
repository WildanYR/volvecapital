import * as crypto from 'crypto';
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
} from 'src/constants/database.const';
import { DashboardUser } from 'src/database/models/dashboard-user.model';
import { Permission } from 'src/database/models/permission.model';
import { Role } from 'src/database/models/role.model';
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

  async changePassword(userId: string, tenantId: string, data: any) {
    const { oldPassword, newPassword } = data;
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

      await transaction.commit();
      return { message: 'Password berhasil diubah' };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async login(dto: LoginDashboardUserDto, tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const hashedPassword = crypto.createHash('sha256').update(dto.password).digest('hex');

      const user = await this.dashboardUserRepository.findOne({
        where: { email: dto.email, password: hashedPassword, is_active: true },
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
        throw new UnauthorizedException('Email atau password salah');
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
        },
      );

      return {
        id: tenantId,
        token,
        name: user.name,
        role: user.role.name,
        permissions,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getMe(id: string, tenantId: string) {
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
        },
      );

      return {
        id: tenantId,
        token,
        name: user.name,
        role: user.role.name,
        permissions,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
