import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { RecieveEmailDto } from './dto/recieve-email.dto';
import { EmailForwardQueueStore } from './email-forward-queue.store';

@Injectable()
export class EmailForwardService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailForwardQueueStore: EmailForwardQueueStore,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY) private readonly emailSubjectRepository: typeof EmailSubject,
  ) {}

  async recieveEmail(payload: RecieveEmailDto) {
    const jobId = this.emailForwardQueueStore.enqueue(payload);
    this.logger.log(`Queued email-forward payload ${jobId}`, 'EmailForwardEnqueue');
  }

  async getEmailSubject() {
    const transaction = await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema('master', transaction);

      const emailSubject = await this.emailSubjectRepository.findAll({ transaction });
      const subjects = emailSubject.map(es => es.dataValues.subject);

      await transaction.commit();
      return { subjects };
    }
    catch {
      await transaction.rollback();
    }
  }
}
