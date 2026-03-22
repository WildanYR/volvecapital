import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { TENANT_REPOSITORY } from 'src/constants/database.const';
import { Tenant } from 'src/database/models/tenant.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { IAccessTokenPayload } from 'src/types/access-token.type';
import { PaginationProvider } from '../utility/pagination.provider';
import { TokenProvider } from '../utility/token.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { GenerateAccessTokenDto } from './dto/generate-access-token.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ITenantGetFilter } from './filter/tenant-get.filter';

@Injectable()
export class TenantService {
  constructor(
    private readonly paginationProvider: PaginationProvider,
    private readonly tokenProvider: TokenProvider,
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepository: typeof Tenant,
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

  async generateAccessToken(generateAccessTokenDto: GenerateAccessTokenDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const tenant = await this.tenantRepository.findOne({
        where: {
          id: generateAccessTokenDto.tenant_id,
          secret: generateAccessTokenDto.secret,
        },
        transaction,
      });

      if (!tenant) {
        throw new UnauthorizedException('App Id or Secret invalid');
      }

      const token = await this.tokenProvider.signJwt<IAccessTokenPayload>(
        tenant.dataValues.secret,
        {
          tenant_id: tenant.id,
          role: 'USER',
        },
      );

      await transaction.commit();
      return {
        id: tenant.id,
        token,
      };
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
