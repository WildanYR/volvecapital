import { Inject, Injectable } from '@nestjs/common';
import { PERMISSION_REPOSITORY } from 'src/constants/database.const';
import { Permission } from 'src/database/models/permission.model';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class PermissionService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: typeof Permission,
  ) {}

  async findAll(tenantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const permissions = await this.permissionRepository.findAll({ transaction });
      await transaction.commit();
      return permissions;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
