import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { QueryTypes } from 'sequelize';
import { AppModule } from '../app.module';
import { PostgresProvider } from '../database/postgres.provider';
import { AccountingService } from '../modules/accounting/accounting.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const postgresProvider = app.get(PostgresProvider);
  const accountingService = app.get(AccountingService);

  console.log('Fetching all tenants...');
  const tenants: any[] = await postgresProvider.rawQuery(
    "SELECT id FROM master.tenant WHERE status = 'active'",
    { type: QueryTypes.SELECT }
  );

  console.log(`Found ${tenants.length} tenants. Starting COA seeding...`);

  for (const tenant of tenants) {
    console.log(`Seeding COA for tenant: ${tenant.id}...`);
    try {
      await accountingService.seedNetflixCoa(tenant.id);
      console.log(`Successfully seeded COA for tenant: ${tenant.id}`);
    }
    catch (error: any) {
      console.error(`Failed to seed COA for tenant: ${tenant.id}`, error.message);
    }
  }

  console.log('All seeding completed.');
  await app.close();
}

bootstrap();
