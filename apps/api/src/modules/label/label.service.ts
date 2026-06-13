import { Inject, Injectable } from '@nestjs/common';
import { LABEL_REPOSITORY } from 'src/constants/database.const';
import { Label } from 'src/database/models/label.model';
import { CreateLabelDto } from './dto/create-label.dto';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class LabelService {
  constructor(
    @Inject(LABEL_REPOSITORY)
    private readonly labelRepository: typeof Label,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async create(tenantId: string, createLabelDto: CreateLabelDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const label = await this.labelRepository.create(createLabelDto as any, { transaction });
      await transaction.commit();
      return label;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(tenantId: string, productVariantId: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const where: any = {};
      if (productVariantId) {
        where.product_variant_id = productVariantId;
      }
      const labels = await this.labelRepository.findAll({ where, transaction });
      await transaction.commit();
      return labels;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const label = await this.labelRepository.findByPk(id, { transaction });
      if (label) {
        await label.destroy({ transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
