import type { Database as BetterSqlite3Database } from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppLoggerService } from '../logger/logger.service';
import { RecieveEmailDto } from './dto/recieve-email.dto';
import { EmailForwardQueueJob } from './types/email-forward-queue-job.type';
import { QueuedRecieveEmailPayload } from './types/queued-recieve-email-payload.type';

// better-sqlite3 ships as CommonJS; require-style loading avoids interop issues in tests.
// eslint-disable-next-line ts/no-require-imports
const DatabaseConstructor = require('better-sqlite3') as typeof import('better-sqlite3');

interface EmailForwardQueueRow {
  id: number;
  payload_json: string;
  status: 'PENDING' | 'PROCESSING';
  attempt: number;
  available_at: string;
  created_at: string;
  started_at: string | null;
  last_error: string | null;
}

@Injectable()
export class EmailForwardQueueStore implements OnModuleDestroy {
  private readonly db: BetterSqlite3Database;

  constructor(
    configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {
    const dbPath = configService.get<string>('queue.dbPath')!;
    const dir = dirname(dbPath);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseConstructor(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('busy_timeout = 5000');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS email_forward_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payload_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        attempt INTEGER NOT NULL DEFAULT 0,
        available_at TEXT NOT NULL DEFAULT (datetime('now')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        started_at TEXT,
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_email_forward_queue_status_available
      ON email_forward_queue(status, available_at, created_at);

      CREATE INDEX IF NOT EXISTS idx_email_forward_queue_created_at
      ON email_forward_queue(created_at);
    `);
  }

  enqueue(payload: RecieveEmailDto) {
    const queuedPayload = this.serializePayload(payload);
    const result = this.db.prepare(`
      INSERT INTO email_forward_queue (payload_json, status, available_at)
      VALUES (?, 'PENDING', ?)
    `).run(JSON.stringify(queuedPayload), new Date().toISOString());

    return Number(result.lastInsertRowid);
  }

  claimNextJob(now = new Date()) {
    const nowIso = now.toISOString();

    const job = this.db.transaction(() => {
      const row = this.db.prepare(`
        SELECT *
        FROM email_forward_queue
        WHERE status = 'PENDING'
          AND available_at <= ?
        ORDER BY available_at ASC, created_at ASC, id ASC
        LIMIT 1
      `).get(nowIso) as EmailForwardQueueRow | undefined;

      if (!row) {
        return null;
      }

      this.db.prepare(`
        UPDATE email_forward_queue
        SET status = 'PROCESSING',
            started_at = ?,
            last_error = NULL
        WHERE id = ?
      `).run(nowIso, row.id);

      return this.mapRow({
        ...row,
        status: 'PROCESSING',
        started_at: nowIso,
        last_error: null,
      });
    })();

    return job;
  }

  deleteJob(id: number) {
    this.db.prepare('DELETE FROM email_forward_queue WHERE id = ?').run(id);
  }

  markJobFailed(id: number, errorMessage: string, delayMs: number, now = new Date()) {
    const availableAt = new Date(now.getTime() + delayMs).toISOString();

    this.db.prepare(`
      UPDATE email_forward_queue
      SET status = 'PENDING',
          attempt = attempt + 1,
          available_at = ?,
          started_at = NULL,
          last_error = ?
      WHERE id = ?
    `).run(availableAt, errorMessage, id);
  }

  recoverStaleJobs(staleTimeoutMs: number, now = new Date()) {
    const cutoff = new Date(now.getTime() - staleTimeoutMs).toISOString();
    const result = this.db.prepare(`
      UPDATE email_forward_queue
      SET status = 'PENDING',
          attempt = attempt + 1,
          available_at = ?,
          started_at = NULL
      WHERE status = 'PROCESSING'
        AND started_at IS NOT NULL
        AND started_at <= ?
    `).run(now.toISOString(), cutoff);

    if (result.changes > 0) {
      this.logger.warn(`Recovered ${result.changes} stale email-forward jobs`, 'EmailForwardQueue');
    }

    return result.changes;
  }

  getJobs() {
    const rows = this.db.prepare(`
      SELECT *
      FROM email_forward_queue
      ORDER BY id ASC
    `).all() as EmailForwardQueueRow[];

    return rows.map(row => this.mapRow(row));
  }

  countJobs() {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM email_forward_queue').get() as { count: number };
    return row.count;
  }

  close() {
    this.db.close();
  }

  onModuleDestroy() {
    this.close();
  }

  private serializePayload(payload: RecieveEmailDto): QueuedRecieveEmailPayload {
    return {
      tenant: payload.tenant,
      emails: payload.emails.map(email => ({
        from: email.from,
        subject: email.subject,
        date: email.date.toISOString(),
        text: email.text,
      })),
    };
  }

  private deserializePayload(payloadJson: string): RecieveEmailDto {
    const payload = JSON.parse(payloadJson) as QueuedRecieveEmailPayload;

    return {
      tenant: payload.tenant,
      emails: payload.emails.map(email => ({
        from: email.from,
        subject: email.subject,
        date: new Date(email.date),
        text: email.text,
      })),
    };
  }

  private mapRow(row: EmailForwardQueueRow): EmailForwardQueueJob {
    return {
      id: row.id,
      status: row.status,
      attempt: row.attempt,
      available_at: row.available_at,
      created_at: row.created_at,
      started_at: row.started_at,
      last_error: row.last_error,
      payload: this.deserializePayload(row.payload_json),
    };
  }
}
