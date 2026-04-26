import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';

@Injectable()
export class EmailSubjectService {
  constructor(
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY)
    private readonly emailSubjectRepository: typeof EmailSubject,
  ) {}

  async findAll() {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const subjects = await this.emailSubjectRepository.findAll({
        order: [['created_at', 'DESC']],
        transaction,
      });
      await transaction.commit();
      return subjects;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async create(data: { context: string; subject: string }) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      const subject = await this.emailSubjectRepository.create(data, { transaction });
      await transaction.commit();
      return subject;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: string) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.emailSubjectRepository.destroy({
        where: { id },
        transaction,
      });
      await transaction.commit();
      return { success: true };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
