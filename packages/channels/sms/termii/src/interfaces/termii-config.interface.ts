export interface TermiiConfig {
    apiKey: string;
    baseUrl?: string;
    from?: string;
    channel?: 'dnd' | 'whatsapp' | 'generic';
    type?: 'plain' | 'byte';
    media?: {
        url: string;
        caption: string;
    };
    timeout?: number;
    [key: string]: any;
}
