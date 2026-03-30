/* eslint-disable node/prefer-global/process */
export function AppConfig() {
  return {
    app: {
      instance_name: process.env.INSTANCE_NAME || 'vc_socket_1',
      port: process.env.PORT ? Number.parseInt(process.env.PORT) : 5100,
      url: process.env.APP_URL ?? 'http://localhost:5100',
      internalSecret: process.env.SOCKET_INTERNAL_SECRET,
    },
  };
}
