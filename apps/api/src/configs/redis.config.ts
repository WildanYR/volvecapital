/* eslint-disable node/prefer-global/process */
export function RedisConfig() {
  return {
    redis: {
      host: process.env.REDIS_HOST ? process.env.REDIS_HOST : '127.0.0.1',
      port: process.env.REDIS_PORT ? Number.parseInt(process.env.REDIS_PORT) : 6379,
    },
  };
}
