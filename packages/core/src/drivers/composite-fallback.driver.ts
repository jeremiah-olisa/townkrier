import { NotificationDriver, Notifiable, SendResult } from '../interfaces/driver.interface';
import { Logger } from '../logger';
import { FallbackStrategy } from '../types/fallback-strategy.enum';
import { NotificationConfigurationException, NotificationSendException } from '../exceptions';
import { DriverEntry } from './driver-entry.interface';
import { RetryConfig } from '../interfaces/retry-config.interface';

/**
 * A meta-driver that manages a collection of sub-drivers and orchestrates sending based on a chosen strategy.
 * It appears as a single `NotificationDriver` to the NotificationManager but internally attempts delivery across its children.
 *
 * Strategies:
 * - `priority-fallback`: Tries drivers in sequence (high priority to low) until one succeeds.
 * - `round-robin`: Rotates sequentially through drivers for each send call.
 * - `random`: Selects a driver randomly (optionally weighted).
 */
export class CompositeFallbackDriver implements NotificationDriver {
  private drivers: DriverEntry[];
  private strategy: FallbackStrategy;
  private currentIndex = 0;
  private defaultRetryConfig: Required<RetryConfig> = {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    maxRetryDelay: 5000,
    retryableErrors: ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND'],
  };

  /**
   * Creates a new CompositeFallbackDriver.
   *
   * @param drivers - List of driver entries with their instances and metadata.
   * @param strategy - The fallback strategy to employ (default: PriorityFallback).
   * @throws NotificationConfigurationException if no drivers are provided or all drivers are disabled.
   */
  constructor(
    drivers: DriverEntry[],
    strategy: FallbackStrategy = FallbackStrategy.PriorityFallback,
  ) {
    if (!drivers || drivers.length === 0) {
      throw new NotificationConfigurationException(
        'CompositeFallbackDriver requires at least one driver',
      );
    }

    // Filter out disabled drivers (enabled defaults to true)
    const enabledDrivers = drivers.filter((d) => d.enabled !== false);

    if (enabledDrivers.length === 0) {
      throw new NotificationConfigurationException(
        'CompositeFallbackDriver requires at least one enabled driver',
      );
    }

    this.drivers = this.sortDrivers(enabledDrivers, strategy);
    this.strategy = strategy;
  }

  private sortDrivers(drivers: DriverEntry[], strategy: FallbackStrategy): DriverEntry[] {
    switch (strategy) {
      case FallbackStrategy.PriorityFallback:
        // Sort by priority (higher first), then by order
        return [...drivers].sort((a, b) => (b.priority || 0) - (a.priority || 0));
      case FallbackStrategy.RoundRobin:
      case FallbackStrategy.Random:
        // Keep original order for round-robin, random doesn't need sorting
        return [...drivers];
      default:
        return drivers;
    }
  }

  async send(notifiable: Notifiable, message: any, config?: any): Promise<SendResult> {
    const driver = this.selectDriver();
    const driverEntry = this.drivers.find((d) => d.driver === driver);
    const failures: { driver: string; error: string }[] = [];

    // Try the selected driver first with retry logic
    try {
      const result = await this.sendWithRetry(
        driver,
        driverEntry,
        notifiable,
        message,
        config,
      );
      if (result.status === 'success') {
        return result;
      }
      failures.push({
        driver: driver.constructor.name,
        error: result.error?.toString() || 'Driver returned non-success status',
      });
    } catch (error: any) {
      failures.push({
        driver: driver.constructor.name,
        error: error.message || String(error),
      });
      Logger.warn(`Primary driver failed after retries, attempting fallback`, {
        error: error.message,
      });
    }

    // If primary fails, try fallback drivers (only for priority-fallback strategy)
    if (this.strategy === FallbackStrategy.PriorityFallback) {
      for (let i = 0; i < this.drivers.length; i++) {
        if (this.drivers[i].driver === driver) continue; // Skip the one we already tried

        try {
          Logger.debug(`Attempting fallback driver ${i + 1}/${this.drivers.length}`);
          const result = await this.sendWithRetry(
            this.drivers[i].driver,
            this.drivers[i],
            notifiable,
            message,
            config,
          );

          if (result.status === 'success') {
            Logger.log(`Fallback driver ${i + 1} succeeded`);
            return result;
          }
          failures.push({
            driver: this.drivers[i].driver.constructor.name,
            error: result.error?.toString() || 'Fallback driver returned non-success',
          });
        } catch (error: any) {
          failures.push({
            driver: this.drivers[i].driver.constructor.name,
            error: error.message || String(error),
          });
          Logger.warn(`Fallback driver ${i + 1} failed after retries`, {
            error: error.message,
          });
        }
      }
    }

    // All drivers failed
    return {
      id: '',
      status: 'failed',
      error: new NotificationSendException(`All drivers failed`, { failures }),
    };
  }

  /**
   * Attempts to send using a driver with retry logic for transient network failures.
   */
  private async sendWithRetry(
    driver: NotificationDriver,
    driverEntry: DriverEntry | undefined,
    notifiable: Notifiable,
    message: any,
    config?: any,
  ): Promise<SendResult> {
    const retryConfig = this.mergeRetryConfig(driverEntry?.retryConfig);
    const maxRetries = retryConfig.maxRetries;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await driver.send(notifiable, message, config);
        if (result.status === 'success') {
          if (attempt > 1) {
            Logger.log(
              `${driver.constructor.name} succeeded on attempt ${attempt}/${maxRetries}`,
            );
          }
          return result;
        }

        // Driver returned failed status
        lastError = result.error instanceof Error ? result.error : new Error(String(result.error));

        // Check if we should retry based on the error
        if (this.shouldRetry(result.error, retryConfig) && attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, retryConfig);
          Logger.warn(
            `${driver.constructor.name} failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
            { error: result.error instanceof Error ? result.error.message : String(result.error) },
          );
          await this.sleep(delay);
          continue;
        }

        // No more retries or error is not retryable
        return result;
      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Only retry on network errors
        if (this.shouldRetry(error, retryConfig) && attempt < maxRetries) {
          const delay = this.calculateDelay(attempt, retryConfig);
          Logger.warn(
            `${driver.constructor.name} threw error (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms`,
            { error: error.message || String(error) },
          );
          await this.sleep(delay);
          continue;
        }

        // No more retries or error is not retryable
        throw error;
      }
    }

    // All retries exhausted
    throw lastError || new Error('All retries failed');
  }

  /**
   * Determines if an error should trigger a retry.
   */
  private shouldRetry(error: any, retryConfig: Required<RetryConfig>): boolean {
    if (!error) return false;

    const errorCode = error.code;
    const errorMessage = error.message || '';

    // Check if error code matches retryable errors
    if (errorCode && retryConfig.retryableErrors.includes(errorCode)) {
      return true;
    }

    // Check for common network error messages
    const networkErrorPatterns = [
      'Unable to fetch data',
      'The request could not be resolved',
      'network timeout',
      'connection timeout',
      'ECONNRESET',
      'socket hang up',
    ];

    return networkErrorPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase()),
    );
  }

  /**
   * Calculates the delay before the next retry attempt.
   */
  private calculateDelay(attempt: number, retryConfig: Required<RetryConfig>): number {
    if (!retryConfig.exponentialBackoff) {
      return retryConfig.retryDelay;
    }

    // Exponential backoff: delay * 2^(attempt-1)
    const delay = retryConfig.retryDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, retryConfig.maxRetryDelay);
  }

  /**
   * Merges driver-specific retry config with defaults.
   */
  private mergeRetryConfig(driverConfig?: RetryConfig): Required<RetryConfig> {
    if (!driverConfig) {
      return this.defaultRetryConfig;
    }

    return {
      maxRetries: driverConfig.maxRetries ?? this.defaultRetryConfig.maxRetries,
      retryDelay: driverConfig.retryDelay ?? this.defaultRetryConfig.retryDelay,
      exponentialBackoff:
        driverConfig.exponentialBackoff ?? this.defaultRetryConfig.exponentialBackoff,
      maxRetryDelay: driverConfig.maxRetryDelay ?? this.defaultRetryConfig.maxRetryDelay,
      retryableErrors: driverConfig.retryableErrors ?? this.defaultRetryConfig.retryableErrors,
    };
  }

  /**
   * Sleeps for the specified duration.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private selectDriver(): NotificationDriver {
    switch (this.strategy) {
      case FallbackStrategy.PriorityFallback:
        // Always use the highest priority (first after sorting)
        return this.drivers[0].driver;

      case FallbackStrategy.RoundRobin:
        // Rotate through drivers
        const driver = this.drivers[this.currentIndex].driver;
        this.currentIndex = (this.currentIndex + 1) % this.drivers.length;
        return driver;

      case FallbackStrategy.Random:
        // Weighted random selection if weights are provided, otherwise uniform
        return this.selectWeightedRandom();

      default:
        return this.drivers[0].driver;
    }
  }

  private selectWeightedRandom(): NotificationDriver {
    const hasWeights = this.drivers.some((d) => d.weight !== undefined);

    if (!hasWeights) {
      // Uniform random
      const randomIndex = Math.floor(Math.random() * this.drivers.length);
      return this.drivers[randomIndex].driver;
    }

    // Weighted random
    const totalWeight = this.drivers.reduce((sum, d) => sum + (d.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const entry of this.drivers) {
      random -= entry.weight || 1;
      if (random <= 0) {
        return entry.driver;
      }
    }

    return this.drivers[0].driver; // Fallback
  }
}
