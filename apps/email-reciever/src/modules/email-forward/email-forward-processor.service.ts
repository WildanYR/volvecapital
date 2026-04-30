import { Inject, Injectable } from "@nestjs/common";
import {
  EMAIL_MESSAGE_REPOSITORY,
  EMAIL_SUBJECT_REPOSITORY,
} from "src/constants/database.const";
import {
  NETFLIX_CANCELLATION,
  NETFLIX_HOUSE_CHANGE,
  NETFLIX_OTP,
  NETFLIX_REQ_RESET_PASSWORD,
  NETFLIX_TRAVEL_OTP,
  NETFLIX_VERIFY_EMAIL,
} from "src/constants/email-subject.const";
import { EmailMessage } from "src/database/models/email-message.model";
import { EmailSubject } from "src/database/models/email-subject.model";
import { PostgresProvider } from "src/database/postgres.provider";
import { AppLoggerService } from "../logger/logger.service";
import { SocketGateway } from "../socket/socket.gateway";
import { EmailParser } from "../utility/email-parser.provider";
import { RecieveEmailDto } from "./dto/recieve-email.dto";

@Injectable()
export class EmailForwardProcessorService {
  private netflixUrls = [
    NETFLIX_REQ_RESET_PASSWORD,
    NETFLIX_TRAVEL_OTP,
    NETFLIX_HOUSE_CHANGE,
    NETFLIX_VERIFY_EMAIL,
    NETFLIX_CANCELLATION,
  ];

  constructor(
    private readonly logger: AppLoggerService,
    private readonly emailParser: EmailParser,
    private readonly socketGateway: SocketGateway,
    private readonly postgresProvider: PostgresProvider,
    @Inject(EMAIL_SUBJECT_REPOSITORY)
    private readonly emailSubjectRepository: typeof EmailSubject,
    @Inject(EMAIL_MESSAGE_REPOSITORY)
    private readonly emailMessageRepository: typeof EmailMessage,
  ) {}

  async processQueuedPayload(payload: RecieveEmailDto) {
    const transaction = await this.postgresProvider.transaction();

    try {
      await this.postgresProvider.setSchema("master", transaction);

      const emailSubjects = payload.emails.map((e) => e.subject);

      const emailSubject = await this.emailSubjectRepository.findAll({
        where: {
          subject: emailSubjects,
        },
        transaction,
      });

      let tenantSchemaSet = false;

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

              if (this.netflixUrls.includes(es.dataValues.context)) {
                data = this.emailParser.extractNetflixUrl(e.text);
                context = NETFLIX_REQ_RESET_PASSWORD;
              }

              if (data && context) {
                if (!tenantSchemaSet) {
                  await this.postgresProvider.setSchema(
                    payload.tenant,
                    transaction,
                  );
                  tenantSchemaSet = true;
                }

                await this.emailMessageRepository.create(
                  {
                    tenant_id: payload.tenant,
                    from_email: e.from,
                    subject: e.subject,
                    email_date: e.date,
                    parsed_context: context,
                    parsed_data: data,
                  },
                  { transaction },
                );

                const sanitizeEmail = this.emailParser.sanitizeEmail(e.from);
                const eventName = `${sanitizeEmail}:${context}`;
                // TODO #send-event: send event only if there is active task depend on the event
                // saat ini setiap ada email masuk selalu mengirim event via socket,
                // ini membuat
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
                      "EmailForwardSendEvent",
                    );
                  });
              }
            }
          }
        }
      }

      await transaction.commit();
    } catch (error) {
      this.logger.error(
        (error as Error).message,
        (error as Error).stack,
        "EmailForwardRecieve",
      );
      await transaction.rollback();
      throw error;
    }
  }
}
