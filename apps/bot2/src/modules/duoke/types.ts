/**
 * Types for Duoke Module
 */

export interface DuokeConfig {
  module: 'duoke';
  name: string;
  loop_interval?: number;
  reply_lines?: string;
  reply_ready_to_ship?: string;
  reply_unpaid?: string;
  Shipped_reply_harian?: string;
  Shipped_reply_habis_harian?: string;
  Shipped_reply_mingguan?: string;
  Shipped_reply_habis_mingguan?: string;
  Shipped_reply_sharing_bulanan?: string;
  Shipped_reply_habis_sharing_bulanan?: string;
  Shipped_reply_bulanan?: string;
  Shipped_reply_habis_bulanan?: string;
  check_interval?: number;
}

export interface DuokeHistory {
  last_reset_date: string;
  replied_users: string[];
}
