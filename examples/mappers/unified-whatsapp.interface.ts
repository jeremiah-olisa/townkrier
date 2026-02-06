/**
 * User-defined unified WhatsApp message interface.
 * Define this in YOUR application - not in the core library.
 */
export interface UnifiedWhatsappMessage {
    to: string;
    text: string;
    media?: string;
    caption?: string;
    type?: 'text' | 'image' | 'video' | 'audio' | 'document';
}
