import { NotificationChannelConfig } from '@townkrier/core';
export interface TermiiConfig extends NotificationChannelConfig {
    apiKey: string;
    senderId?: string;
    channel?: 'generic' | 'dnd' | 'whatsapp';
    baseUrl?: string;
}
//# sourceMappingURL=index.d.ts.map