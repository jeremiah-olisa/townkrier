import { ILogger } from './logger.interface';
import { ConsoleLogger } from './console-logger';
import { LoggerOptions } from '../types/log-options';

export class Logger {
  private static instance: ILogger = new ConsoleLogger();

  /**
   * Override the default logger.
   */
  public static useLogger(logger: ILogger) {
    this.instance = logger;
  }

  /**
   * Initialize the default logger with options.
   * This is useful when you want to use the default ConsoleLogger but with specific options.
   */
  public static configure(options: LoggerOptions) {
    if (this.instance instanceof ConsoleLogger) {
      this.instance = new ConsoleLogger(options);
    }
  }

  public static log(message: any, ...optionalParams: any[]) {
    this.instance.log(message, ...optionalParams);
  }

  public static error(message: any, ...optionalParams: any[]) {
    this.instance.error(message, ...optionalParams);
  }

  public static warn(message: any, ...optionalParams: any[]) {
    this.instance.warn(message, ...optionalParams);
  }

  public static debug(message: any, ...optionalParams: any[]) {
    this.instance.debug?.(message, ...optionalParams);
  }

  public static verbose(message: any, ...optionalParams: any[]) {
    this.instance.verbose?.(message, ...optionalParams);
  }
}
