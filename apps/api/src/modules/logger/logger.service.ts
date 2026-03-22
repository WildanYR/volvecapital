import * as path from 'node:path';
import { Inject, Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as root from 'app-root-path';
import { SYSLOG_REPOSITORY } from 'src/constants/database.const';
import { Syslog } from 'src/database/models/syslog.model';
import { PostgresProvider } from 'src/database/postgres.provider';
import * as winston from 'winston';
import cliColor from 'yoctocolors';
import { DateConverterProvider } from '../utility/date-converter.provider';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor(private readonly dateConverterProvider: DateConverterProvider, private readonly postgresProvider: PostgresProvider, @Inject(SYSLOG_REPOSITORY) private readonly syslogRepository: typeof Syslog) {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: () =>
            dateConverterProvider.formatDateIdStandard(new Date(), {
              showSecond: true,
            }),
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(root.path, 'logs', 'error.log'),
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
              const ctx = context
                ? `${cliColor.magenta(`[${context as string}]`)} `
                : '';
              const stackTrace = stack
                ? `\n${cliColor.gray(stack as string)}`
                : '';
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
    this.saveLogToDb('ERROR', context || 'UNKNOWN', message, trace);
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

  private async saveLogToDb(level: string, context: string, message: string, stack?: string) {
    const strStack = this.convertToString(stack);
    const transaction = await this.postgresProvider.transaction();
    try {
      await this.postgresProvider.setSchema('master', transaction);
      await this.syslogRepository.create({
        level,
        context,
        message,
        stack: strStack,
        created_at: new Date(),
      }, { transaction });
      await transaction.commit();
    }
    catch (error) {
      await transaction.rollback();
      this.logger.log({ level: 'error', message: (error as Error).message, context: 'SaveLogToDb' });
    }
  }

  private convertToString(input: any) {
    if (typeof input === 'string') {
      return input;
    }

    if (input === null || input === undefined) {
      return String(input);
    }

    if (typeof input === 'object') {
      try {
        return JSON.stringify(input);
      }
      catch {
        return String(input);
      }
    }

    return String(input);
  }
}
