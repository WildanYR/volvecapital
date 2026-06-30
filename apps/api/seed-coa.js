require('dotenv').config();
const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/volvecapital'
  });
  await client.connect();

  const schema = 'paytronik'; // Hanya untuk tenant paytronik

  console.log(`Menjalankan seed COA untuk schema: ${schema}...`);

  // Helper untuk mendapatkan/membuat COA
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

  try {
    // Ambil semua produk dan varian
    const res = await client.query(`
      SELECT p.name as product_name, pv.id as variant_id, pv.name as variant_name
      FROM "${schema}".product_variant pv
      JOIN "${schema}".product p ON p.id = pv.product_id
      ORDER BY p.name, pv.name
    `);

    let codeCounter = 1;
    let successCount = 0;

    for (const v of res.rows) {
      const baseName = `${v.product_name} ${v.variant_name}`;
      const suffix = codeCounter.toString();
      
      const persediaanId = await ensureCoa(`1131.${suffix}`, `Persediaan ${baseName}`, 'ASET', 'DEBIT');
      const pDiterimaId = await ensureCoa(`2111.${suffix}`, `Pend. Diterima Di Muka - ${baseName}`, 'KEWAJIBAN', 'KREDIT');
      const pRealisasiId = await ensureCoa(`4101.${suffix}`, `Pend. Realisasi - ${baseName}`, 'PENDAPATAN', 'KREDIT');
      const hppId = await ensureCoa(`5101.${suffix}`, `HPP ${baseName}`, 'HPP', 'DEBIT');

      await client.query(`
        UPDATE "${schema}".product_variant 
        SET 
          income_coa_id = $1,
          expense_coa_id = $2,
          inventory_coa_id = $3,
          deferred_revenue_coa_id = $4,
          revenue_coa_id = $5
        WHERE id = $6
      `, [pDiterimaId, hppId, persediaanId, pDiterimaId, pRealisasiId, v.variant_id]);

      successCount++;
      codeCounter++;
    }

    console.log(`✅ Selesai! Berhasil membuat COA dan memperbarui ${successCount} varian.`);
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
