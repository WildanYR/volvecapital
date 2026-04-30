import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Op, WhereOptions } from 'sequelize';
import { TENANT_REPOSITORY, TENANT_OWNER_REPOSITORY } from 'src/constants/database.const';
import { Tenant } from 'src/database/models/tenant.model';
import { TenantOwner } from 'src/database/models/tenant-owner.model';
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

  async login(loginDto: LoginDto) {
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

      const token = await this.tokenProvider.signJwt<IAccessTokenPayload>(
        this.configService.get<string>('token.secret')!,
        {
          tenant_id: owner.tenant_id,
          role: 'USER',
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
}
