export interface TermiiMessage {
    to?: string | string[];
    from?: string;
    sms?: string; // The message content
    type?: 'plain' | 'byte';
    channel?: 'dnd' | 'whatsapp' | 'generic';
    media?: {
        url: string;
        caption: string;
    };
    [key: string]: any;
}
