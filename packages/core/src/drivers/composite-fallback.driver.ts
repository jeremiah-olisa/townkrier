import { NotificationDriver, Notifiable, SendResult } from '../interfaces/driver.interface';
import { Logger } from '../logger';
import { FallbackStrategy } from '../types/fallback-strategy.enum';
import { NotificationConfigurationException, NotificationSendException } from '../exceptions';
import { DriverEntry } from './driver-entry.interface';

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

  /**
   * Creates a new CompositeFallbackDriver.
   *
   * @param drivers - List of driver entries with their instances and metadata.
   * @param strategy - The fallback strategy to employ (default: PriorityFallback).
   * @throws NotificationConfigurationException if no drivers are provided.
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
    this.drivers = this.sortDrivers(drivers, strategy);
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
    const failures: { driver: string; error: string }[] = [];

    // Try the selected driver first
    try {
      const result = await driver.send(notifiable, message, config);
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
      Logger.warn(`Primary driver failed, attempting fallback`, { error: error.message });
    }

    // If primary fails, try fallback drivers (only for priority-fallback strategy)
    if (this.strategy === FallbackStrategy.PriorityFallback) {
      for (let i = 0; i < this.drivers.length; i++) {
        if (this.drivers[i].driver === driver) continue; // Skip the one we already tried

        try {
          Logger.debug(`Attempting fallback driver ${i + 1}/${this.drivers.length}`);
          const result = await this.drivers[i].driver.send(notifiable, message, config);

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
          Logger.warn(`Fallback driver ${i + 1} failed`, { error: error.message });
        }
      }
    }

    // All drivers failed
    return {
      id: '',
      status: 'failed',
      error: new NotificationSendException(
        `All drivers failed`,
        { failures },
      ),
    };
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
