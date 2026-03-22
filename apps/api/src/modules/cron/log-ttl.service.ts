import { Inject, Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { SYSLOG_REPOSITORY } from 'src/constants/database.const';
import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';

@Injectable()
export class LogTtlService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly postgresProvider: PostgresProvider,
    @Inject(SYSLOG_REPOSITORY) private readonly syslogRepository: typeof Syslog
  ) {}

  async deleteOldLog() {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await this.syslogRepository.destroy({
        where: {
          created_at: { [Op.lt]: sevenDaysAgo },
        },
        transaction,
      });

      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        'LogTtl',
      );
    }
  }
}
