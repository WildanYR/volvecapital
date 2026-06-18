import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ForeignKeyConstraintError } from 'sequelize';
import { MANUAL_BOOK_CATEGORY_REPOSITORY } from 'src/constants/database.const';
import { PostgresProvider } from 'src/database/postgres.provider';
import { ManualBookCategory } from 'src/database/models/manual-book-category.model';
import { CreateManualBookCategoryDto } from './dto/create-manual-book-category.dto';
import { UpdateManualBookCategoryDto } from './dto/update-manual-book-category.dto';

@Injectable()
export class ManualBookCategoryService {
  constructor(
    @Inject(MANUAL_BOOK_CATEGORY_REPOSITORY)
    private readonly manualBookCategoryRepository: typeof ManualBookCategory,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async create(tenantId: string, createDto: CreateManualBookCategoryDto): Promise<ManualBookCategory> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const category = await this.manualBookCategoryRepository.create(
        createDto as any,
        { transaction }
      );
      await transaction.commit();
      return category;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(tenantId: string): Promise<ManualBookCategory[]> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const categories = await this.manualBookCategoryRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return categories;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string): Promise<ManualBookCategory> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const category = await this.manualBookCategoryRepository.findByPk(id, { transaction });
      if (!category) {
        throw new NotFoundException('Manual book category not found');
      }
      await transaction.commit();
      return category;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, updateDto: UpdateManualBookCategoryDto): Promise<ManualBookCategory> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const category = await this.manualBookCategoryRepository.findByPk(id, { transaction });
      if (!category) {
        throw new NotFoundException('Manual book category not found');
      }
      await category.update(updateDto as any, { transaction });
      await transaction.commit();
      return category;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const category = await this.manualBookCategoryRepository.findByPk(id, { transaction });
      if (!category) {
        throw new NotFoundException('Manual book category not found');
      }
      await category.destroy({ transaction });
      await transaction.commit();
    } catch (error: any) {
      await transaction.rollback();
      const isForeignKeyError = 
        error instanceof ForeignKeyConstraintError || 
        error?.name === 'SequelizeForeignKeyConstraintError' || 
        error?.parent?.code === '23503' ||
        (error?.message && error.message.toLowerCase().includes('foreign key constraint'));

      if (isForeignKeyError) {
        throw new BadRequestException('Kategori ini tidak bisa dihapus karena masih digunakan oleh panduan atau sub-kategori lain.');
      }
      throw error;
    }
  }
}
