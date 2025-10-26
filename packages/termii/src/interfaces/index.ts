/**
 * Termii API SMS data
 */
export interface TermiiSmsData {
  api_key: string;
  to: string;
  from: string;
  sms: string;
  type: string;
  channel: string;
}

/**
 * Termii API response
 */
export interface TermiiApiResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

/**
 * Termii error response
 */
export interface TermiiError {
  message: string;
  errors?: Record<string, string[]>;
}
