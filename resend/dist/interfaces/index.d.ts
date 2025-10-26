export interface ResendEmailData {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text: string;
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
export interface ResendApiResponse {
    id: string;
    from: string;
    to: string[];
    created_at: string;
}
export interface ResendError {
    message: string;
    name: string;
}
//# sourceMappingURL=index.d.ts.map