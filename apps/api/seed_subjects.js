const { Client } = require('pg');

async function seedSubjects() {
  const client = new Client({
    connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital'
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const subjects = [
      ['NETFLIX_OTP', 'Your Netflix temporary access code'],
      ['NETFLIX_OTP', 'Your Netflix sign-in code'],
      ['NETFLIX_REQ_RESET_PASSWORD', 'Complete your password reset request'],
      ['NETFLIX_REQ_RESET_PASSWORD', 'Selesaikan permintaanmu untuk mengatur ulang sandi']
    ];

    for (const [context, subject] of subjects) {
      await client.query(
        'INSERT INTO master.email_subject (context, subject, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
        [context, subject]
      );
      console.log(`Inserted: ${subject}`);
    }
    
    console.log('Seeding completed successfully.');
  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

seedSubjects();
