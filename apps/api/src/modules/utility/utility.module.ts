import { Module } from '@nestjs/common';
import { DateConverterProvider } from './date-converter.provider';
import { EmailParser } from './email-parser.provider';
import { PaginationProvider } from './pagination.provider';
import { SnowflakeIdProvider } from './snowflake-id.provider';
import { TokenProvider } from './token.provider';

@Module({
  providers: [
    PaginationProvider,
    SnowflakeIdProvider,
    TokenProvider,
    DateConverterProvider,
    EmailParser,
  ],
  exports: [
    PaginationProvider,
    SnowflakeIdProvider,
    TokenProvider,
    DateConverterProvider,
    EmailParser,
  ],
})
export class UtilityModule {}
