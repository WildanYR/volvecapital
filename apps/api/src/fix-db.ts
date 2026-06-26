import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PostgresProvider } from './database/postgres.provider';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const postgres = app.get(PostgresProvider);
  
  // @ts-ignore
  const queryInterface = postgres['sequelize'].getQueryInterface();
  const schemas = ['capital', 'papapremium', 'paytronik', 'rojolapak'];
  
  for (const schema of schemas) {
    try {
      await queryInterface.sequelize.query(`ALTER TABLE ${schema}.journal_entry ALTER COLUMN date DROP NOT NULL`);
      console.log(`Successfully dropped NOT NULL on ${schema}.journal_entry.date`);
    } catch (e) {
      console.log(`Failed for ${schema}: ${e.message}`);
    }
  }
  
  await app.close();
}
bootstrap();
