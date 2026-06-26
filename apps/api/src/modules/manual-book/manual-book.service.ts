import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { MANUAL_BOOK_REPOSITORY } from 'src/constants/database.const';
import { ManualBookCategory } from 'src/database/models/manual-book-category.model';
import { ManualBook } from 'src/database/models/manual-book.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { CreateManualBookDto } from './dto/create-manual-book.dto';
import { UpdateManualBookDto } from './dto/update-manual-book.dto';

@Injectable()
export class ManualBookService {
  constructor(
    @Inject(MANUAL_BOOK_REPOSITORY)
    private readonly manualBookRepository: typeof ManualBook,
    private readonly postgresProvider: PostgresProvider,
  ) {}

  async create(tenantId: string, createDto: CreateManualBookDto): Promise<ManualBook> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const book = await this.manualBookRepository.create(createDto as any, { transaction });
      await transaction.commit();
      return book;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(tenantId: string, query?: any): Promise<ManualBook[]> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const where: any = {};
      if (query?.status)
        where.status = query.status;
      if (query?.category_id)
        where.category_id = query.category_id;
      if (query?.q) {
        where[Op.or] = [
          { title: { [Op.iLike]: `%${query.q}%` } },
          { content: { [Op.iLike]: `%${query.q}%` } },
        ];
      }

      const books = await this.manualBookRepository.findAll({
        where,
        include: [ManualBookCategory],
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return books;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string): Promise<ManualBook> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const book = await this.manualBookRepository.findByPk(id, {
        include: [ManualBookCategory],
        transaction,
      });
      if (!book) {
        throw new NotFoundException('Manual book not found');
      }
      await transaction.commit();
      return book;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findBySlug(tenantId: string, slug: string): Promise<ManualBook> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const book = await this.manualBookRepository.findOne({
        where: { slug },
        include: [ManualBookCategory],
        transaction,
      });
      if (!book) {
        throw new NotFoundException('Manual book not found');
      }
      await transaction.commit();
      return book;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, updateDto: UpdateManualBookDto): Promise<ManualBook> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const book = await this.manualBookRepository.findByPk(id, { transaction });
      if (!book) {
        throw new NotFoundException('Manual book not found');
      }
      await book.update(updateDto as any, { transaction });
      await transaction.commit();
      return book;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);
      const book = await this.manualBookRepository.findByPk(id, { transaction });
      if (!book) {
        throw new NotFoundException('Manual book not found');
      }
      await book.destroy({ transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
