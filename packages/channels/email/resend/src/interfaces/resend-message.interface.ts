export interface ResendMessage {
    subject: string;
    html?: string;
    text?: string;
    to?: string | string[];
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    reply_to?: string | string[];
    attachments?: any[];
    headers?: Record<string, string>;
    tags?: any[];
    [key: string]: any;
}
