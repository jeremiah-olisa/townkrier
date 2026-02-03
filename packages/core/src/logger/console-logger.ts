import { LogOptions, LogLevel, DEFAULT_LOG_OPTIONS } from '../types/log-options';
import { LoggerInterface } from './logger.interface';

/**
 * Default implementation of LoggerInterface using `console` methods.
 * Respects the global LogOptions configuration.
 */
export class ConsoleLogger implements LoggerInterface {
  private options: LogOptions;

  constructor(options?: LogOptions) {
    this.options = {
      ...DEFAULT_LOG_OPTIONS,
      ...options,
    };
  }

  log(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(LogLevel.LOG)) return;
    this.print(LogLevel.LOG, message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(LogLevel.ERROR)) return;
    this.print(LogLevel.ERROR, message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(LogLevel.WARN)) return;
    this.print(LogLevel.WARN, message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(LogLevel.DEBUG)) return;
    this.print(LogLevel.DEBUG, message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled(LogLevel.VERBOSE)) return;
    this.print(LogLevel.VERBOSE, message, ...optionalParams);
  }

  setLogLevels(levels: LogLevel[]) {
    this.options.logLevels = levels;
  }

  private isLevelEnabled(level: LogLevel): boolean {
    return this.options.logLevels?.includes(level) ?? true;
  }

  private print(level: LogLevel, message: any, ...optionalParams: any[]) {
    const context = this.options.context ? `[${this.options.context}] ` : '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    const prefix = this.options.prefix ? `${this.options.prefix} ` : '';

    const formattedMessage = this.formatMessage(message);
    const output = `${prefix}${timestamp}${context}${formattedMessage}`;

    if (this.options.transport) {
      this.options.transport(level, output, optionalParams);
      return;
    }

    switch (level) {
      case LogLevel.ERROR:
        console.error(output, ...optionalParams);
        break;
      case LogLevel.WARN:
        console.warn(output, ...optionalParams);
        break;
      case LogLevel.DEBUG:
        console.debug(output, ...optionalParams);
        break;
      case LogLevel.VERBOSE:
      case LogLevel.LOG:
      case LogLevel.INFO:
      default:
        console.log(output, ...optionalParams);
        break;
    }
  }

  private formatMessage(message: any): string {
    if (typeof message === 'object' && this.options.json) {
      return JSON.stringify(message);
    }
    return typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  }
}
