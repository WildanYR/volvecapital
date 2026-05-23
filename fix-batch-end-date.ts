import { NestFactory } from '@nestjs/core';
import { AppModule } from './apps/api/src/app.module';
import { PostgresProvider } from './apps/api/src/database/postgres.provider';
import { QueryTypes } from 'sequelize';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const postgresProvider = app.get(PostgresProvider);
  
  console.log('Fixing batch_end_date...');
  
  // Update batch_end_date for all accounts based on MAX(expired_at) of their active users
  const result = await postgresProvider.rawQuery(`
    WITH max_expiry AS (
      SELECT ap.account_id, MAX(au.expired_at) as max_expired_at
      FROM account_user au
      JOIN account_profile ap ON ap.id = au.account_profile_id
      WHERE au.status = 'active'
      GROUP BY ap.account_id
    )
    UPDATE account a
    SET batch_end_date = m.max_expired_at
    FROM max_expiry m
    WHERE a.id = m.account_id 
      AND (a.batch_end_date IS DISTINCT FROM m.max_expired_at);
  `, { type: QueryTypes.UPDATE });
  
  // Also nullify batch_end_date for accounts with NO active users, if they have one
  const nullResult = await postgresProvider.rawQuery(`
    UPDATE account a
    SET batch_end_date = NULL
    WHERE a.batch_end_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM account_user au
        JOIN account_profile ap ON ap.id = au.account_profile_id
        WHERE ap.account_id = a.id AND au.status = 'active'
      );
  `, { type: QueryTypes.UPDATE });

  console.log('Done!');
  await app.close();
}
bootstrap();
