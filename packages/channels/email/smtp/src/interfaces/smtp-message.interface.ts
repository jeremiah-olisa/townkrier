export interface SmtpMessage {
    from?: string | { name: string; address: string };
    to?: string | string[] | { name: string; address: string }[];
    cc?: string | string[] | { name: string; address: string }[];
    bcc?: string | string[] | { name: string; address: string }[];
    subject?: string;
    text?: string | Buffer;
    html?: string | Buffer;
    attachments?: {
        filename: string;
        content?: string | Buffer;
        path?: string;
        contentType?: string;
        cid?: string;
    }[];
    replyTo?: string | { name: string; address: string };
    headers?: Record<string, string | string[]>;
    [key: string]: any;
}
