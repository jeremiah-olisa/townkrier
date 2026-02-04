export type SseResponse = any;

export interface SseConnection {
    userId: string;
    response: SseResponse;
    connectedAt: Date;
    lastHeartbeat: Date;
}

export interface SseConfig {
    heartbeatInterval?: number;
    maxConnections?: number;
    eventType?: string;
    [key: string]: any;
}
