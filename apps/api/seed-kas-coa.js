require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/volvecapital'
  });
  await client.connect();

  const schema = 'paytronik';

  console.log(`Menjalankan seed COA Kas, Modal, dan Beban untuk schema: ${schema}...`);

  async function ensureCoa(code, name, type, normal_balance) {
    const check = await client.query(`SELECT id FROM "${schema}".coa WHERE code = $1`, [code]);
    if (check.rows.length > 0) return check.rows[0].id;
    
    console.log(`-> Membuat COA baru: ${code} - ${name}`);
    const res = await client.query(`
      INSERT INTO "${schema}".coa (code, name, type, normal_balance, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, true, NOW(), NOW())
      RETURNING id
    `, [code, name, type, normal_balance]);
    return res.rows[0].id;
  }

  const coaList = [
    // ASET - KAS & BANK (DEBIT)
    { code: '1111.1', name: 'Kas Shopee Paytronik', type: 'ASET', nb: 'DEBIT' },
    { code: '1111.2', name: 'Kas Shopee Papapremium', type: 'ASET', nb: 'DEBIT' },
    { code: '1111.3', name: 'Kas Shopee Digital Premium', type: 'ASET', nb: 'DEBIT' },
    { code: '1111.4', name: 'Kas Shopee Volvepremium', type: 'ASET', nb: 'DEBIT' },
    { code: '1112.1', name: 'Kas Ovo Gilang', type: 'ASET', nb: 'DEBIT' },
    { code: '1112.2', name: 'Kas Ovo Anang', type: 'ASET', nb: 'DEBIT' },
    { code: '1113.1', name: 'Kas Doku', type: 'ASET', nb: 'DEBIT' },
    { code: '1121.1', name: 'Kas Seabank Rosmiati', type: 'ASET', nb: 'DEBIT' },
    { code: '1121.2', name: 'Kas Seabank Anang', type: 'ASET', nb: 'DEBIT' },
    { code: '1121.3', name: 'Kas Seabank Gilang', type: 'ASET', nb: 'DEBIT' },
    { code: '1122.1', name: 'Kas Jago Gilang', type: 'ASET', nb: 'DEBIT' },
    { code: '1122.2', name: 'Kas Jago Rosmiati', type: 'ASET', nb: 'DEBIT' },
    { code: '1122.3', name: 'Kas Jago Mama', type: 'ASET', nb: 'DEBIT' },
    { code: '1122.4', name: 'Kas Jago Alim', type: 'ASET', nb: 'DEBIT' },
    { code: '1122.5', name: 'Kas Jago Anang', type: 'ASET', nb: 'DEBIT' },
    { code: '1123.1', name: 'Kas Krom Gilang', type: 'ASET', nb: 'DEBIT' },
    { code: '1123.2', name: 'Kas Krom Anang', type: 'ASET', nb: 'DEBIT' },
    { code: '1124.1', name: 'Kas BNI Gilang', type: 'ASET', nb: 'DEBIT' },

    // KEWAJIBAN (KREDIT)
    { code: '2121', name: 'Hutang Gaji Karyawan', type: 'KEWAJIBAN', nb: 'KREDIT' },

    // MODAL (KREDIT)
    { code: '3110', name: 'Modal Digital Premium', type: 'MODAL', nb: 'KREDIT' },
    { code: '3120', name: 'Prive Anang', type: 'MODAL', nb: 'DEBIT' }, // Catatan: Prive normalnya DEBIT karena mengurangi Modal
    { code: '3121', name: 'Prive Gilang', type: 'MODAL', nb: 'DEBIT' }, // Prive normal balance = DEBIT
    { code: '3200', name: 'Laba Ditahan', type: 'MODAL', nb: 'KREDIT' },

    // BEBAN (DEBIT)
    { code: '6110', name: 'Beban Gaji Karyawan', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6210', name: 'Biaya Iklan Shopee Paytronik', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6211', name: 'Biaya Iklan Shopee Digital Premium', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6212', name: 'Biaya Iklan Shopee Papapremium', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6213', name: 'Biaya Iklan Shopee Volvepremium', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6310', name: 'Biaya Internet', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6320', name: 'Biaya Server', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6321', name: 'Biaya Domain', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6330', name: 'Biaya Duoke', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6410', name: 'Biaya Admin Doku Payment Gateway', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6510', name: 'Beban Penyusutan Mini PC', type: 'BEBAN', nb: 'DEBIT' },
    { code: '6999', name: 'Biaya Lain-lain', type: 'BEBAN', nb: 'DEBIT' }
  ];

  try {
    let successCount = 0;
    for (const item of coaList) {
      await ensureCoa(item.code, item.name, item.type, item.nb);
      successCount++;
    }
    console.log(`✅ Selesai! Berhasil membuat ${successCount} COA tambahan.`);
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
