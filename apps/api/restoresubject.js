const { Client } = require('pg');
require('dotenv').config();

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing in .env file!');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const res = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('public', 'master', 'information_schema', 'pg_catalog', 'pg_toast')");
    const schemas = res.rows;

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
          await client.query(
            `INSERT INTO "${schemaName}"."email_subject" (context, subject, is_public, created_at, updated_at) 
             VALUES ($1, $2, $3, NOW(), NOW()) 
             ON CONFLICT DO NOTHING`,
            [sub.context, sub.subject, sub.is_public]
          );
        } catch (err) {
          // ignore if table doesn't exist yet
        }
      }
      console.log(`Inserted default subjects for ${schemaName}`);
    }

    console.log('Done restoring subjects!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
