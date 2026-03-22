import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { NETFLIX_OTP, NETFLIX_REQ_RESET_PASSWORD } from 'src/constants/email-subject.const';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailParser } from '../utility/email-parser.provider';
import { RecieveEmailDto } from './dto/recieve-email.dto';

@Injectable()
export class EmailForwardService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY) private readonly emailSubjectRepository: typeof EmailSubject
  ) {}

  // TODO: save email in database.
  async recieveEmail(payload: RecieveEmailDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

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
              let context: string | null = null;

              if (es.dataValues.context === NETFLIX_OTP) {
                data = this.emailParser.extractNetflixOtp(e.text);
                context = NETFLIX_OTP;
              }

              if (es.dataValues.context === NETFLIX_REQ_RESET_PASSWORD) {
                data = this.emailParser.extractNetflixResetLink(e.text);
                context = NETFLIX_REQ_RESET_PASSWORD;
              }

              if (data && context) {
                const sanitizeEmail = this.emailParser.sanitizeEmail(e.from);
                const eventName = `${sanitizeEmail}:${context}`;
                this.socketGateway.sendEvent(eventName, {
                  from: e.from,
                  date: e.date,
                  subject: e.subject,
                  data,
                });
              }
            }
          }
        }
      }

      await transaction.commit();
    }
    catch (error) {
      this.logger.error(error.message, error.stack, 'EmailForwardRecieve');
      await transaction.rollback();
    }
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
