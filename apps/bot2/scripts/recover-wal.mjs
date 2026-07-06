/**
 * Recovery via WAL: copy db + wal ke lokasi sementara lalu checkpoint
 */

import Database from 'better-sqlite3';
import { existsSync, copyFileSync, unlinkSync } from 'fs';

const STORAGE = 'G:\\My Drive\\VolveBotData\\storage';
const DB_PATH = `${STORAGE}\\database.sqlite`;
const WAL_PATH = `${STORAGE}\\database.sqlite-wal`;
const SHM_PATH = `${STORAGE}\\database.sqlite-shm`;

// Lokasi temp (lokal, bukan Google Drive, agar tidak ada masalah sync)
const TMP_DIR = 'e:\\latihan coding\\1volvecapital\\volvecapital\\apps\\bot2\\scripts\\tmp_recovery';
const TMP_DB  = `${TMP_DIR}\\database.sqlite`;
const TMP_WAL = `${TMP_DB}-wal`;
const TMP_SHM = `${TMP_DB}-shm`;

import { mkdirSync } from 'fs';
mkdirSync(TMP_DIR, { recursive: true });

console.log('=== WAL-based Recovery ===\n');

// Copy semua file ke lokal (bukan Drive) agar tidak ada gangguan sync
console.log('Copying files to local temp directory...');
copyFileSync(DB_PATH, TMP_DB);
if (existsSync(WAL_PATH)) { copyFileSync(WAL_PATH, TMP_WAL); console.log('  ✓ WAL file copied'); }
if (existsSync(SHM_PATH)) { copyFileSync(SHM_PATH, TMP_SHM); console.log('  ✓ SHM file copied'); }

// Coba buka DB (WAL akan otomatis di-merge saat dibuka)
console.log('\nOpening database with WAL...');
let db;
try {
  db = new Database(TMP_DB);
  // Paksa checkpoint
  db.pragma('wal_checkpoint(TRUNCATE)');
  console.log('✓ Checkpoint successful');
} catch (err) {
  console.log('⚠ Checkpoint error:', err.message);
  console.log('Trying integrity check...');
}

// Integrity check
try {
  const result = db.pragma('integrity_check');
  console.log('\nIntegrity check result:');
  result.forEach(r => console.log(' ', r));
} catch (err) {
  console.log('⚠ Integrity check failed:', err.message);
}

// List tables
try {
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all();
  console.log('\nTables found:', tables.map(t => t.name).join(', '));
  
  // Count rows per table
  for (const t of tables) {
    try {
      const cnt = db.prepare(`SELECT COUNT(*) as n FROM "${t.name}"`).get();
      console.log(`  ${t.name}: ${cnt.n} rows`);
    } catch (e) {
      console.log(`  ${t.name}: ERROR - ${e.message}`);
    }
  }
} catch (err) {
  console.log('✗ Cannot read tables:', err.message);
}

if (db) db.close();

console.log(`\nFile sementara ada di: ${TMP_DIR}`);
console.log('Jika data OK, salin TMP_DB ke DB path asli.');
