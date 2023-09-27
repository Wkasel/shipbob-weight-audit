import { createLogger, format, transports } from 'winston';
import { AuditConfig } from './types';
export class Logger {
    private logger: any;
    private debugMode: boolean;

    constructor(config: AuditConfig) {
        this.debugMode = config.debugMode;
        this.logger = createLogger({
            level: this.debugMode ? 'debug' : config.logLevel,
            format: format.combine(
                format.colorize(),
                format.timestamp(),
                format.printf(({ timestamp, level, message }) => {
                    return `${timestamp} ${level}: ${message}`;
                })
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: config.logFile })
            ],
        });
    }

    log(message: string) {
        this.logger.info(message);
    }

    debug(message: string) {
        if (this.debugMode) {
            this.logger.debug(message);
        }
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        this.logger.level = this.debugMode ? 'debug' : 'info';
    }
}
