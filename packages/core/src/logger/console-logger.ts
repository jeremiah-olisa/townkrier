import { LoggerOptions } from '../types/log-options';
import { ILogger } from './logger.interface';

export class ConsoleLogger implements ILogger {
  private options: LoggerOptions;

  constructor(options?: LoggerOptions) {
    this.options = {
      logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
      timestamp: false,
      colors: true,
      ...options,
    };
  }

  log(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('log')) return;
    this.print('log', message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('error')) return;
    this.print('error', message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('warn')) return;
    this.print('warn', message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('debug')) return;
    this.print('debug', message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    if (!this.isLevelEnabled('verbose')) return;
    this.print('verbose', message, ...optionalParams);
  }

  setLogLevels(levels: ('log' | 'error' | 'warn' | 'debug' | 'verbose')[]) {
    this.options.logLevels = levels;
  }

  private isLevelEnabled(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose'): boolean {
    return this.options.logLevels?.includes(level) ?? true;
  }

  private print(level: string, message: any, ...optionalParams: any[]) {
    const context = this.options.context ? `[${this.options.context}] ` : '';
    const timestamp = this.options.timestamp ? `${new Date().toISOString()} ` : '';
    const prefix = this.options.prefix ? `${this.options.prefix} ` : '';

    const formattedMessage = this.formatMessage(message);
    const output = `${prefix}${timestamp}${context}${formattedMessage}`;

    switch (level) {
      case 'error':
        console.error(output, ...optionalParams);
        break;
      case 'warn':
        console.warn(output, ...optionalParams);
        break;
      case 'debug':
        console.debug(output, ...optionalParams);
        break;
      case 'verbose':
      case 'log':
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
