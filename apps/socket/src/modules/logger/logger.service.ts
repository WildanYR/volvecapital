import * as path from 'node:path';
import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as root from 'app-root-path';
import * as winston from 'winston';
import cliColor from 'yoctocolors';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(root.path, 'logs', 'socket-error.log'),
          level: 'error',
          maxsize: 1048576,
          maxFiles: 3,
        }),
        new winston.transports.Console({
          format: winston.format.printf(
            ({ level, message, timestamp, context, stack }) => {
              const timestampColor = cliColor.green(timestamp as string);
              const levelColor = cliColor.bold(
                level === 'info'
                  ? cliColor.blue('INFO')
                  : level === 'error'
                    ? cliColor.red('ERROR')
                    : level === 'warn'
                      ? cliColor.yellow('WARN')
                      : level.toUpperCase(),
              );
              const ctx = context ? `${cliColor.magenta(`[${context as string}]`)} ` : '';
              const stackTrace = stack ? `\n${cliColor.gray(stack as string)}` : '';

              return `[${timestampColor}] ${levelColor}: ${ctx}${message as string}${stackTrace}`;
            },
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.log({ level: 'info', message, context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.log({ level: 'error', message, stack: trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.log({ level: 'warn', message, context });
  }

  debug(message: string, context?: string) {
    this.logger.log({ level: 'debug', message, context });
  }

  verbose(message: string, context?: string) {
    this.logger.log({ level: 'verbose', message, context });
  }
}
