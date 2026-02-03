export interface ExpoMessage {
    to?: string | string[]; // Can be single token or array of tokens
    data?: Record<string, any>;
    title?: string;
    subtitle?: string;
    body?: string;
    sound?: 'default' | null | { critical?: boolean; name?: string; volume?: number };
    ttl?: number;
    expiration?: number;
    priority?: 'default' | 'normal' | 'high';
    badge?: number;
    channelId?: string;
    categoryId?: string;
    mutableContent?: boolean;
    [key: string]: any;
}
