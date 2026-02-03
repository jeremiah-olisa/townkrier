/**
 * Severity levels for logging.
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  LOG = 'log',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Configuration options for the Logger.
 */
export interface LogOptions {
  /**
   * Enabled log levels.
   * @default ['log', 'fatal', 'error', 'warn', 'debug', 'verbose']
   */
  logLevels?: LogLevel[];

  /**
   * Enable or disable logging globally.
   * @default true
   */
  enabled?: boolean;

  /**
   * Minimum severity level to log.
   * Messages below this level will be ignored.
   * @default LogLevel.INFO
   */
  level?: LogLevel;

  /**
   * If enabled, will print timestamp (time difference) between current and previous log message.
   * Note: This option is not used when `json` is enabled.
   * @default false
   */
  timestamp?: boolean;

  /**
   * A prefix to be used for each log message.
   * Note: This option is not used when `json` is enabled.
   * @default undefined
   */
  prefix?: string;

  /**
   * If enabled, will print the log message in JSON format.
   * @default false
   */
  json?: boolean;

  /**
   * If enabled, will print the log message in color.
   * Default true if json is disabled, false otherwise.
   * @default true (when json is false), false (when json is true)
   */
  colors?: boolean;

  /**
   * The context of the logger.
   * @default undefined
   */
  context?: string;

  /**
   * A custom transport function to handle log messages.
   * Defaults to `console.log`, `console.warn`, etc. if not provided.
   */
  transport?: (level: LogLevel, message: string, meta?: any) => void;
}

/**
 * Default logging configuration.
 */
export const DEFAULT_LOG_OPTIONS: LogOptions = {
  enabled: true,
  level: LogLevel.INFO,
  logLevels: [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG, LogLevel.VERBOSE],
  timestamp: true,
};
