export interface WhapiMessage {
    to?: string; // Phone number
    body?: string; // Text message
    media?: string; // URL to media
    caption?: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice';
    quotedMsgId?: string;
    mentions?: string[];
    viewOnce?: boolean;
    [key: string]: any;
}
