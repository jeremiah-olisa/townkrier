import { MessageMapper } from 'townkrier-core';
import { WhapiMessage } from 'townkrier-whapi';
import { WaSendApiMessage } from 'townkrier-wasender';
import { UnifiedWhatsappMessage } from './unified-whatsapp.interface';

/**
 * Maps unified WhatsApp messages to Whapi driver format.
 * You define these mappers in YOUR application code.
 * 
 * This mapper transforms the common/unified format into the
 * driver-specific format that Whapi expects.
 */
export class WhapiMessageMapper implements MessageMapper<UnifiedWhatsappMessage, WhapiMessage> {
    map(message: UnifiedWhatsappMessage): WhapiMessage {
        return {
            to: message.to,
            body: message.text,        // Whapi uses 'body' instead of 'text'
            media: message.media,
            caption: message.caption,
            type: message.type,
        };
    }
}

/**
 * Maps unified WhatsApp messages to WaSender driver format.
 * You define these mappers in YOUR application code.
 * 
 * This mapper transforms the common/unified format into the
 * driver-specific format that WaSender expects.
 */
export class WaSendApiMessageMapper implements MessageMapper<UnifiedWhatsappMessage, WaSendApiMessage> {
    map(message: UnifiedWhatsappMessage): WaSendApiMessage {
        return {
            to: message.to,
            msg: message.text,         // WaSender uses 'msg' instead of 'text'
            url: message.media,        // WaSender uses 'url' instead of 'media'
            type: message.type as any,
        };
    }
}
