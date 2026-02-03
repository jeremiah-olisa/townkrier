export interface DatabaseMessage {
    title: string;
    message: string;
    type?: string;
    actionUrl?: string;
    icon?: string;
    data?: Record<string, unknown>;
    userId?: string; // If explicit or from route
    metadata?: Record<string, unknown>;
    [key: string]: any;
}
