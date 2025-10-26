import { NotificationChannelConfig } from '@townkrier/core';
export interface FcmConfig extends NotificationChannelConfig {
    serviceAccount?: Record<string, unknown>;
    serviceAccountPath?: string;
    projectId?: string;
    databaseURL?: string;
}
//# sourceMappingURL=index.d.ts.map