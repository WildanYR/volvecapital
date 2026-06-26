require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to DB');
  
  const res = await client.query("SELECT nspname FROM pg_namespace WHERE nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast');");
  const schemas = res.rows.map(r => r.nspname);
  
  const seedData = [
    { code: '1060', name: 'Persediaan Netflix Harian', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1061', name: 'Persediaan Netflix Mingguan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1062', name: 'Persediaan Netflix Bulanan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    { code: '1063', name: 'Persediaan Netflix Sharing Bulanan', type: 'ASET', normal_balance: 'DEBIT', is_active: true },
    
    { code: '2010', name: 'Pendapatan Diterima di Muka - Netflix Harian', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
    { code: '2011', name: 'Pendapatan Diterima di Muka - Netflix Mingguan', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
    { code: '2012', name: 'Pendapatan Diterima di Muka - Netflix Bulanan', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
    { code: '2013', name: 'Pendapatan Diterima di Muka - Netflix Sharing', type: 'KEWAJIBAN', normal_balance: 'KREDIT', is_active: true },
    
    { code: '4010', name: 'Pendapatan Realisasi Netflix Harian', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
    { code: '4011', name: 'Pendapatan Realisasi Netflix Mingguan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
    { code: '4012', name: 'Pendapatan Realisasi Netflix Bulanan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
    { code: '4013', name: 'Pendapatan Realisasi Netflix Sharing Bulanan', type: 'PENDAPATAN', normal_balance: 'KREDIT', is_active: true },
    
    { code: '5010', name: 'HPP Netflix Harian', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
    { code: '5011', name: 'HPP Netflix Mingguan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
    { code: '5012', name: 'HPP Netflix Bulanan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
    { code: '5013', name: 'HPP Netflix Sharing Bulanan', type: 'BEBAN', normal_balance: 'DEBIT', is_active: true },
  ];
  
  for (const schema of schemas) {
    if (schema === 'public' || schema.startsWith('pg_')) continue;
    try {
      console.log(`Seeding COA for schema: ${schema}`);
      for (const data of seedData) {
        const check = await client.query(`SELECT id FROM "${schema}"."coa" WHERE code = $1`, [data.code]);
        if (check.rows.length === 0) {
            await client.query(`
            INSERT INTO "${schema}"."coa" (code, name, type, normal_balance, is_active, created_at, updated_at) 
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            `, [data.code, data.name, data.type, data.normal_balance, data.is_active]);
        }
      }
      console.log(`Successfully seeded schema: ${schema}`);
    } catch (e) {
      // Table might not exist in this schema, that's fine
    }
  }
  
  await client.end();
}

run();
