import { Inject, Injectable } from '@nestjs/common';
import { TENANT_SETTING_REPOSITORY } from 'src/constants/database.const';
import { TenantSetting } from 'src/database/models/tenant-setting.model';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class SettingService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(TENANT_SETTING_REPOSITORY)
    private readonly tenantSettingRepository: typeof TenantSetting,
  ) {}

  async findAll(tenantId: string) {
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

  async update(tenantId: string, key: string, value: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      const [setting] = await this.tenantSettingRepository.upsert(
        { key, value },
        { transaction, returning: true }
      );

      await transaction.commit();
      return setting;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async updateBulk(tenantId: string, settings: Record<string, string>) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      
      const updatePromises = Object.entries(settings).map(([key, value]) => 
        this.tenantSettingRepository.upsert(
          { key, value },
          { transaction }
        )
      );

      await Promise.all(updatePromises);

      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
