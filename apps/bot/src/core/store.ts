import Sqlite from 'better-sqlite3';
import { BotInfo } from '../types/bot-info.type.js';
import { OrderStatus } from '../types/order-status.type.js';

const DATABASE_FILE = 'store.sqlite';

let db: Sqlite.Database;
let botInfo: BotInfo;

export function initStore() {
  db = new Sqlite(DATABASE_FILE);
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_info (key TEXT PRIMARY KEY, value TEXT);

    CREATE TABLE IF NOT EXISTS orders (
      orderId TEXT NOT NULL,
      shopee  TEXT NOT NULL,
      status  TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (orderId, shopee)
    );
  `);
}

export function exitStore() {
  try {
    db?.close();
  } catch {}
}

export function setBotInfo(data: BotInfo) {
  const stmt = db.prepare('INSERT INTO bot_info (key, value) VALUES (?, ?);');
  db.transaction(() => {
    for (const info of Object.entries(data)) {
      stmt.run(info[0], info[1]);
    }
  });

  botInfo = data;
  return data;
}

export function getBotInfo() {
  if (botInfo?.tenantId && botInfo?.tenantToken) return botInfo;

  const results = db.prepare('SELECT * FROM bot_info;').all() as {
    key: string;
    value: string;
  }[];

  const info = Object.fromEntries(results.map(({ key, value }) => [key, value]));
  botInfo = info as any;
  return info;
}

export function getOrderStatus(orderId: string): OrderStatus | undefined {
  const order = db.prepare('SELECT status FROM orders WHERE orderId = ?;').get(orderId) as {
    status: string;
  };

  if (!order) return undefined;
  return order.status as OrderStatus;
}

export function updateOrderStatus(orderId: string, status: OrderStatus, shopee: string) {
  db.prepare(
    `
    INSERT INTO orders (orderId, shopee, status)
    VALUES (@orderId, @shopee, @status)
    ON CONFLICT(orderId, shopee) DO UPDATE SET
      status = CASE
        WHEN orders.status IN ('success','failed') THEN orders.status
        ELSE @status
      END
  `,
  ).run({ orderId, status, shopee });
}

export function getProcessableOrders(shopee: string): { orderId: string; status: string }[] {
  const orders = db
    .prepare("SELECT * FROM orders WHERE shopee = ? AND status NOT IN ('success', 'failed');")
    .all(shopee);

  if (!orders?.length) {
    return [];
  }
  return orders as any;
}

export function clearOrderData() {
  db.prepare(
    "DELETE FROM orders WHERE createdAt <= datetime('now', '-30 minutes') AND status IN ('failed', 'success');",
  ).run();
}
