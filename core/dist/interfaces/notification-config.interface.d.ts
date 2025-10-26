export interface NotificationChannelConfig {
    apiKey?: string;
    secretKey?: string;
    baseUrl?: string;
    timeout?: number;
    debug?: boolean;
    [key: string]: unknown;
}
export interface ChannelEnvConfig extends NotificationChannelConfig {
    [key: string]: unknown;
}
export interface ChannelConfig {
    name: string;
    enabled?: boolean;
    priority?: number;
    config: ChannelEnvConfig;
}
export interface NotificationManagerConfig {
    defaultChannel?: string;
    enableFallback?: boolean;
    channels: ChannelConfig[];
}
export type ChannelFactory<T = ChannelEnvConfig> = (config: T) => {
    send(notification: unknown): Promise<unknown>;
    getChannelName(): string;
    getChannelType(): string;
    isReady(): boolean;
};
//# sourceMappingURL=notification-config.interface.d.ts.map