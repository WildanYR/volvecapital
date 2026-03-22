import { Global, Module } from '@nestjs/common';
import { PostgresProvider } from './postgres.provider';
import { RepositoryProvider } from './repository.provider';

@Global()
@Module({
  providers: [PostgresProvider, ...RepositoryProvider],
  exports: [PostgresProvider, ...RepositoryProvider],
})
export class DatabaseModule {}
