export interface FcmMessage {
    notification?: {
        title?: string;
        body?: string;
        imageUrl?: string;
    };
    data?: { [key: string]: string };
    android?: any; // Start with any or specific FCM types
    webpush?: any;
    apns?: any;
    fcmOptions?: any;
    token?: string; // Optional if provided via route
    tokens?: string[]; // For multicast
    topic?: string;
    condition?: string;
    [key: string]: any;
}
