export interface MailtrapConfig {
    token: string;
    endpoint?: string;
    from?: { email: string; name?: string };
}
