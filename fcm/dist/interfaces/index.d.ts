export interface FcmMessageData {
    token?: string;
    tokens?: string[];
    notification?: {
        title: string;
        body: string;
        imageUrl?: string;
    };
    data?: Record<string, string>;
    android?: {
        priority?: 'high' | 'normal';
        notification?: {
            icon?: string;
            color?: string;
            sound?: string;
        };
    };
    apns?: {
        payload?: {
            aps?: {
                badge?: number;
                sound?: string;
            };
        };
    };
    webpush?: {
        notification?: {
            icon?: string;
        };
    };
}
export interface FcmSendResponse {
    successCount: number;
    failureCount: number;
    responses: Array<{
        success: boolean;
        messageId?: string;
        error?: {
            code: string;
            message: string;
        };
    }>;
}
//# sourceMappingURL=index.d.ts.map