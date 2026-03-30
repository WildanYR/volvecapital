import { Module } from '@nestjs/common';
import { TokenProvider } from './token.provider';

@Module({
  providers: [TokenProvider],
  exports: [TokenProvider],
})
export class UtilityModule {}
