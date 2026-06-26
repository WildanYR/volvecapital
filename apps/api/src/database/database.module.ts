import { Global, Module } from '@nestjs/common';
import { MigrationProvider } from './migration.provider';
import { PostgresProvider } from './postgres.provider';
import { RepositoryProvider } from './repository.provider';

@Global()
@Module({
  providers: [PostgresProvider, MigrationProvider, ...RepositoryProvider],
  exports: [PostgresProvider, MigrationProvider, ...RepositoryProvider],
})
export class DatabaseModule {}
