/* eslint-disable node/prefer-global/process */
export function DatabaseConfig() {
  return {
    database: {
      url:
      process.env.DATABASE_URL
      || 'postgres://postgres:postgres@localhost:5432/volvecapital',
      pool: {
        min: Number.parseInt(process.env.DATABASE_POOL_MIN || '0'),
        max: Number.parseInt(process.env.DATABASE_POOL_MAX || '10'),
        acquire: Number.parseInt(process.env.DATABASE_POOL_AQUIRE || '30000'),
        idle: Number.parseInt(process.env.DATABASE_POOL_IDLE || '10000'),
        evict: Number.parseInt(process.env.DATABASE_POOL_EVICT || '1000'),
      },
    },
  };
}
