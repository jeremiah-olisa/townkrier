import type { ServiceAccount } from 'firebase-admin';

export interface FcmConfig {
    serviceAccount?: ServiceAccount;
    serviceAccountPath?: string;
    projectId?: string;
    databaseURL?: string;
    [key: string]: any;
}
