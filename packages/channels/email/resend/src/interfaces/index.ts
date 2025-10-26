/**
 * Resend API email data
 */
export interface ResendEmailData {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text: string; // Required by Resend
  cc?: string[];
  bcc?: string[];
  reply_to?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
}

/**
 * Resend API response
 */
export interface ResendApiResponse {
  id: string;
  from: string;
  to: string[];
  created_at: string;
}

/**
 * Resend error response
 */
export interface ResendError {
  message: string;
  name: string;
}
