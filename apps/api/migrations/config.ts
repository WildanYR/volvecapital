/* eslint-disable node/prefer-global/process */
import 'dotenv/config';

function getEnv(key: string, required = true): string {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value!;
}

export const CONFIG = {
  DATABASE_URL: getEnv('DATABASE_MIGRATION_URL'),
  TENANT_SCHEMAS: getEnv('TENANT_SCHEMAS', false) || '',
};
