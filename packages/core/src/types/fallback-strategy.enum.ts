/**
 * Strategies for handling multiple drivers within a single channel (Fallback/Composite drivers).
 */
export enum FallbackStrategy {
  /**
   * **Priority Fallback**: Configured drivers are tried in order of their `priority` (highest first).
   * If a driver fails, the next one in the list is attempted.
   */
  PriorityFallback = 'priority-fallback',

  /**
   * **Round Robin**: Distributes notification load evenly across all configured drivers.
   * Useful for load balancing high-volume channels.
   */
  RoundRobin = 'round-robin',

  /**
   * **Random**: Selects a driver randomly.
   * Supports weighting via the `weight` property in config to prefer certain drivers (e.g., 70/30 split).
   */
  Random = 'random',
}
