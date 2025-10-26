import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { ChannelEnvConfig, ChannelFactory, NotificationManagerConfig } from '../interfaces';
export declare class NotificationManager {
    private readonly channels;
    private readonly factories;
    private readonly channelConfigs;
    private defaultChannel?;
    private enableFallback;
    constructor(config?: NotificationManagerConfig);
    registerFactory<T = ChannelEnvConfig>(name: string, factory: ChannelFactory<T>): this;
    registerChannel(name: string, channel: INotificationChannel): this;
    getChannel(name: string): INotificationChannel;
    getDefaultChannel(): INotificationChannel;
    getChannelWithFallback(preferredChannel?: string): INotificationChannel | null;
    getAvailableChannels(): string[];
    getReadyChannels(): string[];
    hasChannel(name: string): boolean;
    isChannelReady(name: string): boolean;
    setDefaultChannel(name: string): this;
    setFallbackEnabled(enabled: boolean): this;
    removeChannel(name: string): this;
    clear(): this;
    private getSortedChannels;
}
//# sourceMappingURL=notification-manager.d.ts.map