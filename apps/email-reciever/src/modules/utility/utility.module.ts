import { Module } from '@nestjs/common';
import { EmailParser } from './email-parser.provider';

@Module({
  providers: [EmailParser],
  exports: [EmailParser],
})
export class UtilityModule {}
