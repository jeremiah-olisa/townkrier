import { LoggerInterface } from './logger.interface';
import { ConsoleLogger } from './console-logger';
import { LogOptions, DEFAULT_LOG_OPTIONS, LogLevel } from '../types/log-options';

/**
 * Static Logger facade.
 * Provides global access to logging capabilities across the library.
 *
 * Use `Logger.configure()` to override defaults or supply a custom logger.
 *
 * @example
 * ```typescript
 * Logger.info('System initializing...');
 * Logger.error('Something crashed', errorObject);
 * ```
 */
export class Logger {
  private static instance: LoggerInterface = new ConsoleLogger();
  private static options: LogOptions = DEFAULT_LOG_OPTIONS;

  /**
   * Configure the global logger options.
   * @param options Partial LogOptions object
   */
  static configure(options: Partial<LogOptions>) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Override the underlying logger implementation (e.g., with Winston or Pino).
   * @param logger Custom implementation of LoggerInterface
   */
  static overrideLogger(logger: LoggerInterface) {
    this.instance = logger;
  }

  /**
   * Logs an info level message.
   */
  static log(message: string, context?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    this.instance.log(message, context);
  }

  /**
   * Alias for `log`. Logs an info level message.
   */
  static info(message: string, context?: any) {
    this.log(message, context);
  }

  /**
   * Logs an error level message.
   */
  static error(message: string, trace?: any, context?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    this.instance.error(message, trace, context);
  }

  /**
   * Logs a warning level message.
   */
  static warn(message: string, context?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    this.instance.warn(message, context);
  }

  /**
   * Logs a debug level message.
   */
  static debug(message: string, context?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    if (this.instance.debug) {
      this.instance.debug(message, context);
    }
  }

  /**
   * Logs a verbose level message.
   */
  static verbose(message: string, context?: any) {
    if (!this.shouldLog(LogLevel.VERBOSE)) return;
    if (this.instance.verbose) {
      this.instance.verbose(message, context);
    }
  }
  // TODO: implement this properly
  private static shouldLog(messageLevel: LogLevel): boolean {
    if (!this.options.enabled) return false;
    // Hierarchy: Error > Warn > Log/Info > Debug > Verbose
    // We treat LOG and INFO as equivalent for ordering
    // const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.LOG, LogLevel.INFO, LogLevel.DEBUG, LogLevel.VERBOSE];

    // Normalize config level: if LOG, treat as INFO index or vice versa?
    // Actually if we list both, they have distinct indices.
    // Let's assume LOG is same priority as INFO.
    // Better strategy: map levels to numeric priority.

    // Simple array with distinct levels:
    const orderedLevels = [
      LogLevel.ERROR,
      LogLevel.WARN,
      LogLevel.INFO,
      LogLevel.DEBUG,
      LogLevel.VERBOSE,
    ];

    let configLevel = this.options.level || LogLevel.INFO;
    if (configLevel === LogLevel.LOG) configLevel = LogLevel.INFO;

    let msgLevel = messageLevel;
    if (msgLevel === LogLevel.LOG) msgLevel = LogLevel.INFO;

    const configLevelIndex = orderedLevels.indexOf(configLevel);
    const messageLevelIndex = orderedLevels.indexOf(msgLevel);

    return messageLevelIndex <= configLevelIndex;
  }
}
