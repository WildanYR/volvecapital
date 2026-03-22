import { createLogger, format, transports } from 'winston';
import { formatDateIdStandard } from './date-converter.js';
import path from 'path';
import colors from 'yoctocolors';
import { LogWithNotifyOpts } from '../types/logger.type.js';
import { notify } from '../services/notify.service.js';

const ERROR_LOG_FILE = path.join('logs', 'error.log');

function colorizeLogLevel(level: string) {
  if (level === 'INFO') {
    return colors.bgBlue(level);
  }

  if (level === 'ERROR') {
    return colors.bgRed(level);
  }

  if (level === 'WARN') {
    return colors.bgYellow(level);
  }

  return level;
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

export const logger = {
  log(message: string, withNotifyOpts?: LogWithNotifyOpts) {
    winston.log({ level: 'info', message });

    if (withNotifyOpts) {
      notify(withNotifyOpts.notifyContext, withNotifyOpts.notifyMessage).catch((error) => {
        winston.log({
          level: 'error',
          message: `❌ Notifikasi Error: ${(error as Error).message}`,
        });
      });
    }
  },

  error(message: string, trace?: string, withNotifyOpts?: LogWithNotifyOpts) {
    winston.log({ level: 'error', message, stack: trace });

    if (withNotifyOpts) {
      notify(withNotifyOpts.notifyContext, withNotifyOpts.notifyMessage).catch((error) => {
        winston.log({
          level: 'error',
          message: `❌ Notifikasi Error: ${(error as Error).message}`,
        });
      });
    }
  },

  warn(message: string, withNotifyOpts?: LogWithNotifyOpts) {
    winston.log({ level: 'warn', message });

    if (withNotifyOpts) {
      notify(withNotifyOpts.notifyContext, withNotifyOpts.notifyMessage).catch((error) => {
        winston.log({
          level: 'error',
          message: `❌ Notifikasi Error: ${(error as Error).message}`,
        });
      });
    }
  },

  debug(message: string, withNotifyOpts?: LogWithNotifyOpts) {
    winston.log({ level: 'debug', message });

    if (withNotifyOpts) {
      notify(withNotifyOpts.notifyContext, withNotifyOpts.notifyMessage).catch((error) => {
        winston.log({
          level: 'error',
          message: `❌ Notifikasi Error: ${(error as Error).message}`,
        });
      });
    }
  },

  verbose(message: string, withNotifyOpts?: LogWithNotifyOpts) {
    winston.log({ level: 'verbose', message });

    if (withNotifyOpts) {
      notify(withNotifyOpts.notifyContext, withNotifyOpts.notifyMessage).catch((error) => {
        winston.log({
          level: 'error',
          message: `❌ Notifikasi Error: ${(error as Error).message}`,
        });
      });
    }
  },
};
