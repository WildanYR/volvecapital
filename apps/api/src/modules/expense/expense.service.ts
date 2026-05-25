import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { WhereOptions } from 'sequelize';
import { EXPENSE_REPOSITORY } from 'src/constants/database.const';
import { Expense } from 'src/database/models/expense.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { PaginationProvider } from '../utility/pagination.provider';
import { BaseGetAllUrlQuery } from '../utility/types/base-get-all-url-query.type';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { IExpenseGetFilter } from './filter/expense-get.filter';

@Injectable()
export class ExpenseService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    private readonly paginationProvider: PaginationProvider,
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: typeof Expense
  ) {}

  async findAll(
    tenantId: string,
    pagination?: BaseGetAllUrlQuery,
    filter?: IExpenseGetFilter
  ) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const { limit, offset, order } = this.paginationProvider.generatePaginationQuery(pagination);

      const whereOptions: WhereOptions = {};
      if (filter?.subject_id) {
        whereOptions.subject_id = filter.subject_id;
      }
      if (filter?.type) {
        whereOptions.type = filter.type;
      }

      const accountExpenses = await this.expenseRepository.findAndCountAll({
        where: whereOptions,
        order,
        limit,
        offset,
        transaction,
      });

      await transaction.commit();

      return this.paginationProvider.generatePaginationResponse(accountExpenses.rows, accountExpenses.count, pagination);
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findOne(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountExpense = await this.expenseRepository.findOne({
        where: { id },
        transaction,
      });

      if (!accountExpense) {
        throw new NotFoundException(`Expense with id: ${id} not found`);
      }

      await transaction.commit();
      return accountExpense;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(tenantId: string, createDto: CreateExpenseDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const newExpense = await this.expenseRepository.create(
        {
          ...createDto,
          amount: createDto.amount.toString(),
        } as any,
        { transaction }
      );

      await transaction.commit();
      return newExpense;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(tenantId: string, id: string, updateDto: UpdateExpenseDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountExpense = await this.expenseRepository.findOne({
        where: { id },
        transaction,
      });

      if (!accountExpense) {
        throw new NotFoundException(`Expense with id: ${id} not found`);
      }

      await accountExpense.update(
        {
          ...updateDto,
          amount: updateDto.amount ? updateDto.amount.toString() : accountExpense.amount,
        } as any,
        { transaction }
      );

      await transaction.commit();
      return accountExpense;
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(tenantId: string, id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema(tenantId, transaction);

      const accountExpense = await this.expenseRepository.findOne({
        where: { id },
        transaction,
      });

      if (!accountExpense) {
        throw new NotFoundException(`Expense with id: ${id} not found`);
      }

      await accountExpense.destroy({ transaction });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
