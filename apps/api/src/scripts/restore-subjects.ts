import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PostgresProvider } from '../database/postgres.provider';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const postgresProvider = app.get(PostgresProvider);

  console.log('Fetching all tenant schemas...');
  const result: any = await postgresProvider.rawQuery(
    "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('public', 'master', 'information_schema', 'pg_catalog', 'pg_toast')"
  );

  const schemas = result[0] || result;

  const defaultSubjects = [
    { context: 'NETFLIX_OTP', subject: 'Kode verifikasi sementara', is_public: false },
    { context: 'NETFLIX_OTP', subject: 'Temporary verification code', is_public: false },
    { context: 'NETFLIX_REQ_RESET_PASSWORD', subject: 'Sandi Anda telah disetel ulang', is_public: false },
    { context: 'NETFLIX_REQ_RESET_PASSWORD', subject: 'Reset your password', is_public: false },
    { context: 'NETFLIX_REQ_RESET_PASSWORD', subject: 'Penyetelan ulang sandi', is_public: false },
    { context: 'NETFLIX_HOUSE_CHANGE', subject: 'Update your Netflix Household', is_public: false },
    { context: 'NETFLIX_HOUSE_CHANGE', subject: 'Perbarui Rumah Netflix Anda', is_public: false },
    { context: 'NETFLIX_TRAVEL_OTP', subject: 'Your temporary access code', is_public: false },
    { context: 'NETFLIX_TRAVEL_OTP', subject: 'Kode akses sementara', is_public: false },
  ];

  for (const row of schemas) {
    const schemaName = row.schema_name;
    console.log(`Processing schema: ${schemaName}`);
    
    for (const sub of defaultSubjects) {
      try {
        await postgresProvider.rawQuery(
          `INSERT INTO "${schemaName}"."email_subject" (context, subject, is_public, created_at, updated_at) 
           VALUES (:context, :subject, :is_public, NOW(), NOW()) 
           ON CONFLICT DO NOTHING`,
          {
            replacements: {
              context: sub.context,
              subject: sub.subject,
              is_public: sub.is_public
            }
          }
        );
      } catch (err) {
        // Ignore if table doesn't exist or other error
      }
    }
    console.log(`Inserted default subjects for ${schemaName}`);
  }

  console.log('Done restoring subjects!');
  await app.close();
  process.exit(0);
}

bootstrap();
