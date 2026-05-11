/**
 * Types for Duoke Module
 */

export interface DuokeConfig {
  module: 'duoke';
  name: string;
  loop_interval?: number;
  reply_lines?: string;
  check_interval?: number;
}

export interface DuokeHistory {
  last_reset_date: string;
  replied_users: string[];
}
