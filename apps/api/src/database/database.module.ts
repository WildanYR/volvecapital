import { Global, Module } from '@nestjs/common';
import { PostgresProvider } from './postgres.provider';
import { RepositoryProvider } from './repository.provider';
import { MigrationProvider } from './migration.provider';

@Global()
@Module({
  providers: [PostgresProvider, MigrationProvider, ...RepositoryProvider],
  exports: [PostgresProvider, MigrationProvider, ...RepositoryProvider],
})
export class DatabaseModule {}
