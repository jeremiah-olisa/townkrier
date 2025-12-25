import { Logger, ILogger } from '@townkrier/core';

// 1. Test Default Logger
console.log('--- Testing Default Logger ---');
Logger.log('This is a log message');
Logger.error('This is an error message');
Logger.warn('This is a warning message');
Logger.debug('This is a debug message (may not show if default level excludes it)');

// 2. Test Configuration
console.log('\n--- Testing Configuration (JSON, Timestamp) ---');
Logger.configure({
  json: true,
  timestamp: true,
  prefix: 'TEST',
  logLevels: ['log', 'error', 'warn', 'debug', 'verbose'],
});

Logger.log('This should be JSON with timestamp');
Logger.warn({ type: 'warning', code: 123 });

// 3. Test Custom Logger
console.log('\n--- Testing Custom Logger Injection ---');
class CustomLogger implements ILogger {
  log(message: any, ...optionalParams: any[]) {
    console.log('[CUSTOM] LOG:', message, ...optionalParams);
  }
  error(message: any, ...optionalParams: any[]) {
    console.log('[CUSTOM] ERROR:', message, ...optionalParams);
  }
  warn(message: any, ...optionalParams: any[]) {
    console.log('[CUSTOM] WARN:', message, ...optionalParams);
  }
  debug(message: any, ...optionalParams: any[]) {
    console.log('[CUSTOM] DEBUG:', message, ...optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]) {
    console.log('[CUSTOM] VERBOSE:', message, ...optionalParams);
  }
}

Logger.useLogger(new CustomLogger());
Logger.log('This should be handled by CustomLogger');
Logger.error('This error too');

console.log('\n--- Verification Complete ---');
