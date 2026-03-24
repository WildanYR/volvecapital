/**
 * Logger - Multi-transport logging system
 */

import { createLogger, format, transports, type Logger as WinstonLogger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as colors from 'yoctocolors';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { LoggerConfig } from '../types/config.type.js';
import { LogContext, LogLevel, LogToDbOptions } from '../types/logger.type.js';
import { AuthCredentials, authHeaders } from './auth.js';
import { getProjectRoot } from '../utils/path.js';

const { combine, timestamp, printf, errors } = format;

export class Logger {
    private winston: WinstonLogger;
    private instanceId: string | null;
    private authCredentials: AuthCredentials;
    private baseApiUrl: string

    constructor(config: LoggerConfig, authCredentials: AuthCredentials, baseApiUrl: string, instanceId?: string) {
        this.instanceId = instanceId || null;
        this.authCredentials = authCredentials;
        this.baseApiUrl = baseApiUrl;

        // Ensure log directory exists
        const logDir = resolve(getProjectRoot(), 'storage', 'logs');
        if (!existsSync(logDir)) {
            mkdirSync(logDir, { recursive: true });
        }

        // Custom format for console with colors
        const consoleFormat = printf(({ level, message, timestamp, instanceId: ctxInstanceId }) => {
            const time = colors.dim(timestamp as string);
            const id = ctxInstanceId ? colors.cyan(`[${ctxInstanceId}]`) : '';

            let levelStr: string;
            switch (level) {
                case 'error':
                    levelStr = colors.red(colors.bold('ERROR'));
                    break;
                case 'warn':
                    levelStr = colors.yellow(colors.bold('WARN'));
                    break;
                case 'info':
                    levelStr = colors.green('INFO');
                    break;
                case 'debug':
                    levelStr = colors.magenta('DEBUG');
                    break;
                default:
                    levelStr = level.toUpperCase();
            }

            return `${time} ${levelStr} ${id} ${message}`;
        });

        // File format (JSON)
        const fileFormat = combine(
            timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            errors({ stack: true }),
            format.json()
        );

        this.winston = createLogger({
            level: config.level,
            transports: [
                // Console transport with colors
                new transports.Console({
                    format: combine(
                        timestamp({ format: 'HH:mm:ss' }),
                        consoleFormat
                    ),
                }),
                // Daily rotating file transport
                new DailyRotateFile({
                    filename: resolve(logDir, 'app-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                    format: fileFormat,
                }),
            ],
        });
    }

    /**
     * Create child logger for module instance
     */
    child(instanceId: string): Logger {
        const childLogger = new Logger(
            { level: this.winston.level as LogLevel },
            this.authCredentials,
            this.baseApiUrl,
            instanceId
        );
        return childLogger;
    }

    debug(message: string, context?: LogContext, logToDbOptions?: LogToDbOptions): void {
        this.log('debug', message, context, logToDbOptions);
    }

    info(message: string, context?: LogContext, logToDbOptions?: LogToDbOptions): void {
        this.log('info', message, context, logToDbOptions);
    }

    warn(message: string, context?: LogContext, logToDbOptions?: LogToDbOptions): void {
        this.log('warn', message, context, logToDbOptions);
    }

    error(message: string, context?: LogContext, logToDbOptions?: LogToDbOptions): void {
        this.log('error', message, context, logToDbOptions);
    }

    private log(level: LogLevel, message: string, context?: LogContext, logToDbOptions?: LogToDbOptions): void {
        const instanceId = context?.instanceId || this.instanceId;

        this.winston.log({
            level,
            message,
            instanceId,
            ...context,
        });

        if (logToDbOptions) {
            this.sendLogToDb(logToDbOptions.level, logToDbOptions.context, logToDbOptions.customMessage || message)
        }
    }

    private async sendLogToDb(level: string, context: string, message: string, stack?: string) {
        try {
            const headers = authHeaders(this.authCredentials);
            const url = `${this.baseApiUrl}/log`;

            const res = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    level,
                    context,
                    message,
                    stack,
                    created_at: new Date()
                })
            });

            if (!res.ok) {
                const data = await res.json() as { message?: string };
                this.winston.log({
                    level: 'error',
                    message: data.message || 'Failed to Log to DB',
                    instanceId: 'LogToDb'
                });
            }
        } catch (err) {
            this.winston.log({
                level: 'error',
                message: `sendLogToDb network error: ${err instanceof Error ? err.message : 'Unknown'}`,
                instanceId: 'LogToDb'
            });
        }
    }

    /**
     * Close logger (no-op, kept for backward compatibility)
     */
    async close(): Promise<void> {
        // No longer needs to sync to API
    }
}
