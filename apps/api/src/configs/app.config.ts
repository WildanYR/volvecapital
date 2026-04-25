/* eslint-disable node/prefer-global/process */
export function AppConfig() {
  return {
    app: {
      instance_name: process.env.INSTANCE_NAME || 'vc_api_1',
      port: process.env.PORT ? Number.parseInt(process.env.PORT) : 4000,
      url: process.env.APP_URL ?? 'http://localhost:3000',
    },
  };
}
