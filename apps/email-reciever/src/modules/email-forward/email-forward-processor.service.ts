import { Inject, Injectable } from '@nestjs/common';
import {
  EMAIL_MESSAGE_TS_REPOSITORY,
  EMAIL_SUBJECT_REPOSITORY,
} from 'src/constants/database.const';
import { NETFLIX_URL_EXTRACT, OTP_EXTRACT } from 'src/constants/email-extract-method.const';
import { EmailMessageTS } from 'src/database/models/email-message-ts.model';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailParser } from '../utility/email-parser.provider';
import { RecieveEmailDto } from './dto/recieve-email.dto';

@Injectable()
export class EmailForwardProcessorService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY)
    private readonly emailSubjectRepository: typeof EmailSubject,
    @Inject(EMAIL_MESSAGE_TS_REPOSITORY)
    private readonly emailMessageTSRepository: typeof EmailMessageTS,
  ) {}

  async processQueuedPayload(payload: RecieveEmailDto) {
    const transaction = await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema(payload.tenant, transaction);

      const emailSubjects = payload.emails.map(e => e.subject);

      const emailSubject = await this.emailSubjectRepository.findAll({
        where: {
          subject: emailSubjects,
        },
        transaction,
      });

      if (emailSubject?.length) {
        for (const es of emailSubject) {
          for (const e of payload.emails) {
            if (e.subject === es.dataValues.subject) {
              let data: string | null = null;

              if (es.dataValues.extract_method === OTP_EXTRACT) {
                data = this.emailParser.extractOtp(e.text);
              }

              if (es.dataValues.extract_method === NETFLIX_URL_EXTRACT) {
                data = this.emailParser.extractNetflixUrl(e.text);
              }

              if (data) {
                await this.emailMessageTSRepository.create(
                  {
                    tenant_id: payload.tenant,
                    from_email: e.from,
                    subject: e.subject,
                    email_date: e.date,
                    parsed_context: es.dataValues.context,
                    parsed_data: data,
                  },
                  { transaction },
                );

                const sanitizeEmail = this.emailParser.sanitizeEmail(e.from);
                const eventName = `${sanitizeEmail}:${es.dataValues.context}`;
                void this.socketGateway
                  .sendEvent(eventName, {
                    from: e.from,
                    date: e.date,
                    subject: e.subject,
                    data,
                  })
                  .catch((error: Error) => {
                    this.logger.error(
                      error.message,
                      error.stack,
                      'EmailForwardSendEvent',
                    );
                  });
              }
            }
          }
        }
      }

      await transaction.commit();
    }
    catch (error) {
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        'EmailForwardRecieve',
      );
      await transaction.rollback();
      throw error;
    }
  }
}
