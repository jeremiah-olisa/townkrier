export interface SseMessage {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: Record<string, unknown>;
    to?: string | string[]; // User Id primarily
    [key: string]: any;
}

export interface SseNotificationEvent {
    id: string;
    userId: string;
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: Record<string, unknown>;
    timestamp: string;
}
