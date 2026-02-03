export interface MailtrapMessage {
    subject: string;
    text?: string;
    html?: string;
    to?: Array<{ email: string; name?: string }>;
    from?: { email: string; name?: string };
    cc?: Array<{ email: string; name?: string }>;
    bcc?: Array<{ email: string; name?: string }>;
    attachments?: Array<{
        filename: string;
        content: string | Buffer;
        type?: string;
        disposition?: string;
        content_id?: string;
    }>;
    custom_variables?: Record<string, any>;
    headers?: Record<string, string>;
    category?: string;
    // allow additional properties
    [key: string]: any;
}
