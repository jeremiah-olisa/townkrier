export interface TermiiSmsData {
    api_key: string;
    to: string;
    from: string;
    sms: string;
    type: string;
    channel: string;
}
export interface TermiiApiResponse {
    message_id: string;
    message: string;
    balance: number;
    user: string;
}
export interface TermiiError {
    message: string;
    errors?: Record<string, string[]>;
}
//# sourceMappingURL=index.d.ts.map