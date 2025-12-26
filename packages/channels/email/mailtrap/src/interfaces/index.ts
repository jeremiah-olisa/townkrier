/**
 * Mailtrap API email data
 * Based on Mailtrap Client Send options
 */
export interface MailtrapEmailData {
  from: {
    email: string;
    name?: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  text?: string;
  html?: string;
  cc?: Array<{
    email: string;
    name?: string;
  }>;
  bcc?: Array<{
    email: string;
    name?: string;
  }>;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    type?: string;
    disposition?: 'inline' | 'attachment';
    content_id?: string;
  }>;
  headers?: Record<string, string>;
  category?: string;
  custom_variables?: Record<string, string>;
}

/**
 * Mailtrap API response
 */
export interface MailtrapApiResponse {
  success: boolean;
  message_ids: string[];
}
