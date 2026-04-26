const { Client } = require('pg');

async function checkEmailMessages() {
  const client = new Client({
    connectionString: 'postgres://postgres:123456@localhost:5432/volvecapital'
  });

  try {
    await client.connect();
    console.log('Connected to database.');
    
    // Cek di skema papapremium
    const res = await client.query('SELECT * FROM papapremium.email_message ORDER BY created_at DESC LIMIT 5');
    console.log('\n--- 5 Email Terakhir di papapremium.email_message ---');
    if (res.rows.length === 0) {
      console.log('Tabel kosong di skema papapremium.');
    } else {
      console.table(res.rows);
    }
    
    // Cek juga di master kalau-kalau salah masuk
    const resMaster = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'master' AND table_name = 'email_message'");
    if (resMaster.rows.length > 0) {
        const resM = await client.query('SELECT * FROM master.email_message ORDER BY created_at DESC LIMIT 5');
        console.log('\n--- 5 Email Terakhir di master.email_message ---');
        console.table(resM.rows);
    }

  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

checkEmailMessages();
