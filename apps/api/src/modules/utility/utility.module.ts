import { Module } from '@nestjs/common';
import { DateConverterProvider } from './date-converter.provider';
import { EmailParser } from './email-parser.provider';
import { PaginationProvider } from './pagination.provider';
import { SnowflakeIdProvider } from './snowflake-id.provider';
import { TokenProvider } from './token.provider';
import { MailService } from './mail.service';

@Module({
  providers: [
    PaginationProvider,
    SnowflakeIdProvider,
    TokenProvider,
    DateConverterProvider,
    EmailParser,
    MailService,
  ],
  exports: [
    PaginationProvider,
    SnowflakeIdProvider,
    TokenProvider,
    DateConverterProvider,
    EmailParser,
    MailService,
  ],
})
export class UtilityModule {}
