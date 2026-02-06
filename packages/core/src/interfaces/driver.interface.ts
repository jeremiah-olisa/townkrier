/**
 * Interface that any entity (User, Order, etc.) must implement to receive notifications.
 *
 * @example
 * ```typescript
 * class User implements Notifiable {
 *   routeNotificationFor(driver: string) {
 *     if (driver === 'email') return this.email;
 *     if (driver === 'sms') return this.phone;
 *   }
 * }
 * ```
 */
export interface Notifiable<TDriver = string> {
  /**
   * Determines the routing information (e.g., email address, phone number) for a specific driver.
   *
   * @param driver - The identifier of the driver requesting routing info.
   * @returns The routing information (string, object, etc.) or undefined if not routable.
   */
  routeNotificationFor(driver: TDriver): string | undefined | unknown;

  /**
   * Index signature to allow other properties on the Notifiable entity.
   */
  [key: string]: unknown;
}

/**
 * Maps one message type to another.
 * Users can implement this to convert unified messages to driver-specific formats
 * when using multiple drivers with different message interfaces.
 *
 * @template TInput - The input message type (e.g., your unified message)
 * @template TOutput - The output message type (e.g., driver-specific message)
 *
 * @example
 * ```typescript
 * class MyWhatsappMapper implements MessageMapper<MyUnifiedMsg, WhapiMessage> {
 *   map(message: MyUnifiedMsg): WhapiMessage {
 *     return { to: message.to, body: message.text };
 *   }
 * }
 * ```
 */
export interface MessageMapper<TInput = unknown, TOutput = unknown> {
  /**
   * Transform the input message to the output format.
   */
  map(message: TInput): TOutput;
}

/**
 * Represents a result returned by a driver after attempting to send a notification.
 */
export interface SendResult<TResponse = unknown> {
  /**
   * Unique ID or reference for the sent message (provider specific).
   */
  id: string;

  /**
   * Status of the send attempt.
   */
  status: 'success' | 'failed' | 'queued';

  /**
   * The raw response from the provider (e.g., API return body).
   */
  response?: TResponse;

  /**
   * Error object if the status is 'failed'.
   */
  error?: unknown;
}

/**
 * The contract that all Notification Drivers must implement.
 * Wraps the logic for sending a message via a specific provider (e.g., Resend, Twilio).
 *
 * @template ConfigType - The type of configuration object this driver expects.
 * @template MessageType - The type of message payload this driver expects.
 *
 * @example
 * ```typescript
 * class MyCustomDriver implements NotificationDriver<MyConfig, MyMessage> {
 *   constructor(private config: MyConfig) {}
 *
 *   async send(notifiable: Notifiable, message: MyMessage): Promise<SendResult> {
 *     // logic to call external API
 *   }
 * }
 * ```
 */
export interface NotificationDriver<ConfigType = unknown, MessageType = unknown> {
  /**
   * Sends the given message to the notifiable entity.
   *
   * @param notifiable - The entity receiving the notification.
   * @param message - The constructed message payload.
   * @param config - Optional configuration override for this send.
   * @returns A promise resolving to the SendResult.
   */
  send(notifiable: Notifiable, message: MessageType, config?: ConfigType): Promise<SendResult>;
}
