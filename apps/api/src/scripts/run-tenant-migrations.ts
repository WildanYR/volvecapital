import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigrationProvider } from '../database/migration.provider';
import { PostgresProvider } from '../database/postgres.provider';
import { QueryTypes } from 'sequelize';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const migrationProvider = app.get(MigrationProvider);
  const postgresProvider = app.get(PostgresProvider);

  console.log('Fetching all tenants...');
  const tenants: any[] = await postgresProvider.rawQuery(
    'SELECT id FROM master.tenant WHERE status = \'active\'',
    { type: QueryTypes.SELECT }
  );

  console.log(`Found ${tenants.length} tenants. Starting migrations...`);

  for (const tenant of tenants) {
    console.log(`Migrating tenant: ${tenant.id}...`);
    try {
      await migrationProvider.migrateTenant(tenant.id);
      console.log(`Successfully migrated tenant: ${tenant.id}`);
    } catch (error: any) {
      console.error(`Failed to migrate tenant: ${tenant.id}`, error.message);
    }
  }

  console.log('All migrations completed.');
  await app.close();
}

bootstrap();
