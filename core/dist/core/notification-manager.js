"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationManager = void 0;
const exceptions_1 = require("../exceptions");
class NotificationManager {
    constructor(config) {
        this.channels = new Map();
        this.factories = new Map();
        this.channelConfigs = new Map();
        this.enableFallback = false;
        if (config) {
            this.defaultChannel = config.defaultChannel;
            this.enableFallback = config.enableFallback ?? false;
            config.channels.forEach((channelConfig) => {
                this.channelConfigs.set(channelConfig.name, channelConfig);
            });
        }
    }
    registerFactory(name, factory) {
        this.factories.set(name.toLowerCase(), factory);
        const config = this.channelConfigs.get(name.toLowerCase());
        if (config && config.enabled !== false) {
            try {
                const channel = factory(config.config);
                this.channels.set(name.toLowerCase(), channel);
            }
            catch (error) {
                console.error(`Failed to initialize channel '${name}':`, error);
            }
        }
        return this;
    }
    registerChannel(name, channel) {
        this.channels.set(name.toLowerCase(), channel);
        return this;
    }
    getChannel(name) {
        const channel = this.channels.get(name.toLowerCase());
        if (!channel) {
            throw new exceptions_1.NotificationConfigurationException(`Notification channel '${name}' is not registered or enabled`, {
                channelName: name,
                availableChannels: Array.from(this.channels.keys()),
            });
        }
        if (!channel.isReady()) {
            throw new exceptions_1.NotificationConfigurationException(`Notification channel '${name}' is not ready. Please check configuration.`, {
                channelName: name,
            });
        }
        return channel;
    }
    getDefaultChannel() {
        if (!this.defaultChannel) {
            const firstChannel = this.channels.values().next().value;
            if (firstChannel) {
                return firstChannel;
            }
            throw new exceptions_1.NotificationConfigurationException('No default channel configured and no channels available', {
                availableChannels: Array.from(this.channels.keys()),
            });
        }
        return this.getChannel(this.defaultChannel);
    }
    getChannelWithFallback(preferredChannel) {
        if (preferredChannel) {
            try {
                const channel = this.getChannel(preferredChannel);
                if (channel.isReady()) {
                    return channel;
                }
            }
            catch (error) {
                if (!this.enableFallback) {
                    throw error;
                }
                console.warn(`Preferred channel '${preferredChannel}' not available, trying fallback`);
            }
        }
        if (this.defaultChannel && (!preferredChannel || preferredChannel !== this.defaultChannel)) {
            try {
                const channel = this.getChannel(this.defaultChannel);
                if (channel.isReady()) {
                    return channel;
                }
            }
            catch (error) {
                if (!this.enableFallback) {
                    throw error;
                }
                console.warn(`Default channel '${this.defaultChannel}' not available, trying fallback`);
            }
        }
        if (this.enableFallback) {
            const sortedChannels = this.getSortedChannels();
            for (const [name, channel] of sortedChannels) {
                if (channel.isReady() && name !== preferredChannel && name !== this.defaultChannel) {
                    console.warn(`Using fallback channel: ${name}`);
                    return channel;
                }
            }
        }
        return null;
    }
    getAvailableChannels() {
        return Array.from(this.channels.keys());
    }
    getReadyChannels() {
        return Array.from(this.channels.entries())
            .filter(([, channel]) => channel.isReady())
            .map(([name]) => name);
    }
    hasChannel(name) {
        return this.channels.has(name.toLowerCase());
    }
    isChannelReady(name) {
        const channel = this.channels.get(name.toLowerCase());
        return channel ? channel.isReady() : false;
    }
    setDefaultChannel(name) {
        if (!this.hasChannel(name)) {
            throw new exceptions_1.NotificationConfigurationException(`Cannot set '${name}' as default channel. Channel not registered.`, {
                channelName: name,
                availableChannels: this.getAvailableChannels(),
            });
        }
        this.defaultChannel = name.toLowerCase();
        return this;
    }
    setFallbackEnabled(enabled) {
        this.enableFallback = enabled;
        return this;
    }
    removeChannel(name) {
        this.channels.delete(name.toLowerCase());
        this.factories.delete(name.toLowerCase());
        this.channelConfigs.delete(name.toLowerCase());
        if (this.defaultChannel === name.toLowerCase()) {
            this.defaultChannel = undefined;
        }
        return this;
    }
    clear() {
        this.channels.clear();
        this.factories.clear();
        this.channelConfigs.clear();
        this.defaultChannel = undefined;
        return this;
    }
    getSortedChannels() {
        return Array.from(this.channels.entries()).sort((a, b) => {
            const configA = this.channelConfigs.get(a[0]);
            const configB = this.channelConfigs.get(b[0]);
            const priorityA = configA?.priority ?? 0;
            const priorityB = configB?.priority ?? 0;
            return priorityB - priorityA;
        });
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=notification-manager.js.map