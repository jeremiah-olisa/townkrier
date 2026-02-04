/**
 * Configuration for retry behavior when sending notifications.
 */
export interface RetryConfig {
    /**
     * Maximum number of retry attempts.
     * @default 3
     */
    maxRetries?: number;

    /**
     * Initial delay in milliseconds before the first retry.
     * @default 1000
     */
    retryDelay?: number;

    /**
     * Whether to use exponential backoff for retry delays.
     * When enabled, delay = min(retryDelay * 2^(attempt-1), maxRetryDelay)
     * @default true
     */
    exponentialBackoff?: boolean;

    /**
     * Maximum delay in milliseconds between retries (cap for exponential backoff).
     * @default 5000
     */
    maxRetryDelay?: number;

    /**
     * List of error codes that should trigger a retry.
     * @default ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND']
     */
    retryableErrors?: string[];
}
