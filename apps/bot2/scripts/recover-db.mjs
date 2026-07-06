/**
 * Script untuk recovery database SQLite yang corrupt.
 * Cara kerja: baca semua data yang bisa dibaca dari DB lama,
 * lalu buat DB baru yang bersih dengan data yang berhasil di-recover.
 *
 * Jalankan: node scripts/recover-db.mjs
 */

import Database from 'better-sqlite3';
import { existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';

const DB_PATH = 'G:\\My Drive\\VolveBotData\\storage\\database.sqlite';
const RECOVERED_PATH = 'G:\\My Drive\\VolveBotData\\storage\\database_recovered.sqlite';

console.log('=== SQLite Recovery Script ===\n');
console.log('Source DB :', DB_PATH);
console.log('Output DB :', RECOVERED_PATH);
console.log('');

if (!existsSync(DB_PATH)) {
  console.error('ERROR: Database file not found!');
  process.exit(1);
}

// 1. Buka DB lama dengan mode readonly
let sourceDb;
try {
  sourceDb = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  console.log('✓ Opened source database');
} catch (err) {
  console.error('✗ Cannot open source database:', err.message);
  process.exit(1);
}

// 2. Buka/buat DB baru
let targetDb;
try {
  targetDb = new Database(RECOVERED_PATH);
  console.log('✓ Created target database\n');
} catch (err) {
  console.error('✗ Cannot create target database:', err.message);
  process.exit(1);
}

// 3. Dapatkan daftar semua tabel dari DB lama
let tables = [];
try {
  tables = sourceDb
    .prepare(`SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY rowid`)
    .all();
  console.log(`Found ${tables.length} table(s):`);
  tables.forEach(t => console.log(' -', t.name));
  console.log('');
} catch (err) {
  console.error('✗ Cannot read table list:', err.message);
  sourceDb.close();
  targetDb.close();
  process.exit(1);
}

// 4. Recover setiap tabel
let totalRecovered = 0;
let totalFailed = 0;

for (const table of tables) {
  process.stdout.write(`Recovering table "${table.name}"... `);

  try {
    // Buat tabel di DB baru
    targetDb.exec(table.sql);

    // Baca data dari tabel lama
    let rows = [];
    try {
      rows = sourceDb.prepare(`SELECT * FROM "${table.name}"`).all();
    } catch (readErr) {
      console.log(`⚠ Read error (partial data possible): ${readErr.message}`);
      // Coba baca row per row jika bulk gagal
      try {
        const countRow = sourceDb.prepare(`SELECT COUNT(*) as cnt FROM "${table.name}"`).get();
        const count = countRow?.cnt ?? 0;
        for (let i = 0; i < count; i++) {
          try {
            const row = sourceDb.prepare(`SELECT * FROM "${table.name}" LIMIT 1 OFFSET ${i}`).get();
            if (row) rows.push(row);
          } catch {
            totalFailed++;
          }
        }
      } catch {
        console.log(`  ✗ Skipping table "${table.name}" - cannot read at all`);
        continue;
      }
    }

    if (rows.length === 0) {
      console.log('(empty)');
      continue;
    }

    // Insert ke DB baru
    const cols = Object.keys(rows[0]);
    const placeholders = cols.map(() => '?').join(', ');
    const insertStmt = targetDb.prepare(
      `INSERT OR IGNORE INTO "${table.name}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`
    );

    const insertMany = targetDb.transaction((rowList) => {
      for (const row of rowList) {
        insertStmt.run(Object.values(row));
      }
    });

    insertMany(rows);
    totalRecovered += rows.length;
    console.log(`✓ ${rows.length} rows`);

  } catch (err) {
    console.log(`✗ Error: ${err.message}`);
    totalFailed++;
  }
}

// 5. Copy indexes dan triggers jika ada
try {
  const indexes = sourceDb
    .prepare(`SELECT sql FROM sqlite_master WHERE type IN ('index','trigger') AND sql IS NOT NULL`)
    .all();
  for (const idx of indexes) {
    try { targetDb.exec(idx.sql); } catch { /* skip if already exists */ }
  }
  console.log(`\n✓ Indexes/triggers restored`);
} catch (err) {
  console.log(`\n⚠ Could not restore indexes: ${err.message}`);
}

sourceDb.close();
targetDb.close();

console.log('\n=== Recovery Summary ===');
console.log(`Rows recovered : ${totalRecovered}`);
console.log(`Failures       : ${totalFailed}`);
console.log(`Output file    : ${RECOVERED_PATH}`);
console.log('');
console.log('Langkah selanjutnya:');
console.log('1. Cek isi database_recovered.sqlite');
console.log('2. Jika data terlihat OK, rename file:');
console.log('   - Rename database.sqlite -> database.sqlite.corrupt');
console.log('   - Rename database_recovered.sqlite -> database.sqlite');
console.log('3. Jalankan bot kembali');
