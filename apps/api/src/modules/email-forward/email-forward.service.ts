import { Inject, Injectable } from '@nestjs/common';
import { EMAIL_MESSAGE_REPOSITORY, EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { NETFLIX_OTP, NETFLIX_REQ_RESET_PASSWORD } from 'src/constants/email-subject.const';
import { EmailSubject } from 'src/database/models/email-subject.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import { AppLoggerService } from '../logger/logger.service';
import { SocketGateway } from '../socket/socket.gateway';
import { EmailParser } from '../utility/email-parser.provider';
import { RecieveEmailDto } from './dto/recieve-email.dto';

import { EmailMessage } from 'src/database/models/email-message.model';

@Injectable()
export class EmailForwardService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY) private readonly emailSubjectRepository: typeof EmailSubject,
    @Inject(EMAIL_MESSAGE_REPOSITORY) private readonly emailMessageRepository: typeof EmailMessage
  ) {}

  // TODO: save email in database.
  async recieveEmail(payload: RecieveEmailDto) {
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);

      const emailSubjects = payload.emails.map(e => e.subject);

      const emailSubject = await this.emailSubjectRepository.findAll({
        where: {
          subject: {
            [Op.or]: payload.emails.map(e => ({ [Op.iLike]: e.subject.trim() }))
          }
        },
        transaction,
      });

      if (emailSubject?.length) {
        // Switch to tenant schema to save messages
        await this.postgresProvider.setSchema(payload.tenant, transaction);

        for (const es of emailSubject) {
          for (const e of payload.emails) {
            const incomingSubject = e.subject.trim().toLowerCase();
            const dbSubject = es.dataValues.subject.trim().toLowerCase();
            
            if (incomingSubject === dbSubject) {
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

              if (es.dataValues.context === 'NETFLIX_GENERAL_NOTIFICATION') {
                data = e.text; // Save full text for general notifications
                context = 'NETFLIX_GENERAL_NOTIFICATION';
              }

              if (data && context) {
                // 1. Save to database
                  await this.emailMessageRepository.create({
                    tenant_id: payload.tenant,
                    from_email: e.from,
                    recipient_email: e.recipient,
                    subject: e.subject,
                    email_date: new Date(e.date),
                    parsed_context: context,
                    parsed_data: data,
                  }, { transaction });

                // 2. Send via Socket
                // Hanya kirim sinyal jika email baru (kurang dari 2 menit yang lalu)
                const twoMinutesAgo = Date.now() - (2 * 60 * 1000);
                const isRecent = new Date(e.date).getTime() > twoMinutesAgo;

                if (isRecent) {
                    const sanitizeEmail = this.emailParser.sanitizeEmail(e.recipient);
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
