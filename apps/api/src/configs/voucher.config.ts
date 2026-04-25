/* eslint-disable node/prefer-global/process */
export function VoucherConfig() {
  return {
    voucher: {
      expiryHours: Number.parseInt(process.env.VOUCHER_EXPIRY_HOURS || '24'),
    },
    midtrans: {
      serverKey: process.env.MIDTRANS_SERVER_KEY || '',
      clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
      isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    },
    fonnte: {
      token: process.env.FONNTE_TOKEN || '',
    },
    stock: {
      lowThreshold: Number.parseInt(process.env.STOCK_LOW_THRESHOLD || '3'),
    },
  };
}
