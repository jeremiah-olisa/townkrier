export interface MailtrapConfig {
    token: string;
    endpoint?: string;
    testInboxId?: number;
    accountId?: number;
    from?: { email: string; name?: string };
}
