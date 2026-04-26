const { Client } = require('pg');

async function checkEmailSubjects() {
  const client = new Client({
    connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital'
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    const res = await client.query('SELECT * FROM master.email_subject');
    console.log('\n--- Daftar Email Subject (Table: master.email_subject) ---');
    if (res.rows.length === 0) {
      console.log('Tabel kosong. Tidak ada subjek email terdaftar.');
    } else {
      console.table(res.rows);
    }
  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

checkEmailSubjects();
