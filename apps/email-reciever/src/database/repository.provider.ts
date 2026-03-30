import type { Provider } from '@nestjs/common';
import { EMAIL_MESSAGE_REPOSITORY, EMAIL_SUBJECT_REPOSITORY } from 'src/constants/database.const';
import { EmailMessage } from './models/email-message.model';
import { EmailSubject } from './models/email-subject.model';

export const RepositoryProvider: Provider[] = [
  { provide: EMAIL_SUBJECT_REPOSITORY, useValue: EmailSubject },
  { provide: EMAIL_MESSAGE_REPOSITORY, useValue: EmailMessage },
];
