/* eslint-disable node/prefer-global/process */
export function TelegramConfig() {
  return {
    telegram: {
      token: process.env.TELEGRAM_TOKEN,
    },
  };
}
