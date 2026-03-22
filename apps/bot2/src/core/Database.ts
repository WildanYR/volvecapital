/**
 * Database - SQLite wrapper with system tables
 */

import DatabaseConstructor, { type Database as BetterSqlite3Database, type RunResult } from 'better-sqlite3';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

export class Database {
  private db: BetterSqlite3Database;

  constructor(dbPath: string) {
    // Ensure directory exists
    const dir = dirname(dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseConstructor(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Initialize system tables
   */
  initSystemTables(): void {
    // Key-Value Store
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sys_kv_store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Task Queue & History
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sys_tasks (
        id TEXT PRIMARY KEY,
        module_instance_id TEXT NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'INTERNAL',
        status TEXT NOT NULL DEFAULT 'PENDING',
        payload TEXT DEFAULT '{}',
        execute_at TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        started_at TEXT,
        completed_at TEXT,
        error TEXT
      )
    `);

    // Create index for faster queue queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON sys_tasks(status)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_instance ON sys_tasks(module_instance_id)
    `);
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_execute_at ON sys_tasks(execute_at)
    `);
  }

  /**
   * Get single row
   */
  get<T>(query: string, params: unknown[] = []): T | undefined {
    const stmt = this.db.prepare(query);
    return stmt.get(...params) as T | undefined;
  }

  /**
   * Get all rows
   */
  all<T>(query: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(query);
    return stmt.all(...params) as T[];
  }

  /**
   * Run a query (insert, update, delete)
   */
  run(query: string, params: unknown[] = []): RunResult {
    const stmt = this.db.prepare(query);
    return stmt.run(...params);
  }

  /**
   * Execute raw SQL (for DDL statements)
   */
  exec(query: string): void {
    this.db.exec(query);
  }

  /**
   * Run multiple statements in a transaction
   */
  transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }

  /**
   * Get raw database instance (for advanced usage)
   */
  getRaw(): BetterSqlite3Database {
    return this.db;
  }
}
