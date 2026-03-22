import { createLogger, format, transports } from 'winston';
import path from 'path';
import colors from 'yoctocolors';

export function formatDateIdStandard(date, hideTime) {
  if (!date) return '';

  const dt = new Date(date);

  const tanggal = dt.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  const waktu = dt
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    })
    .replace('.', ':');
  let formatted = tanggal;
  if (!hideTime) {
    formatted += ` ${waktu} WIB`;
  }
  return formatted;
}

const ERROR_LOG_FILE = path.join('logs', 'error.log');

function colorizeLogLevel(level) {
  if (level === 'INFO') {
    return colors.bgBlue(` ${level} `);
  }

  if (level === 'ERROR') {
    return colors.bgRed(` ${level} `);
  }

  if (level === 'WARN') {
    return colors.bgYellow(` ${level} `);
  }

  return colors.bgWhite(` ${level} `);
}

const consoleFormat = format.printf(({ level, message }) => {
  const timestamp = formatDateIdStandard(new Date());
  const levelText = level.toLocaleUpperCase();

  let printText = `[${colors.magenta(timestamp)}] ${colorizeLogLevel(levelText)} : ${message}`;

  return printText;
});

const fileFormat = format.combine(
  format.timestamp({ format: () => formatDateIdStandard(new Date()) }),
  format.errors({ stack: true }),
  format.json(),
);

const winston = createLogger({
  level: 'info',
  transports: [
    new transports.Console({ format: consoleFormat }),
    new transports.File({
      level: 'error',
      maxsize: 1048576,
      format: fileFormat,
      filename: ERROR_LOG_FILE,
    }),
  ],
});

winston.log({
  level: 'info',
  message: `${colors.yellowBright('Paytronik')} ${colors.bold('[215493661283924]')} Memproses Pesanan`,
});
winston.log({
  level: 'warn',
  message: `${colors.yellowBright('Paytronik')} ${colors.bold('[215493661283924]')} username tidak ditemukan. mengganti dengan id pesanan`,
});
winston.log({
  level: 'info',
  message: `${colors.yellowBright('Paytronik')} Mencoba Login ke Shopee`,
});
winston.log({
  level: 'error',
  message: `${colors.cyan('Worker Loop')} ${colors.bold('[paytronik-runner]')} Terjadi error: page.goto: net::ERR_FAILED at https://seller.shopee.co.id/portal/sale/order?type=toship`,
});
