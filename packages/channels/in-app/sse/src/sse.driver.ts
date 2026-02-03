import { NotificationDriver, SendResult, Notifiable, Logger } from 'townkrier-core';
import { createSession, Session } from 'better-sse';
import { SseConfig } from './interfaces/sse-config.interface';
import { SseMessage, SseNotificationEvent } from './interfaces/sse-message.interface';
import { IncomingMessage, ServerResponse } from 'http';

export class SseDriver implements NotificationDriver<SseConfig, SseMessage> {
    // @ts-ignore - Usage of generic type depends on library version
    private userSessions: Map<string, Set<Session<unknown>>>;
    private sseConfig: SseConfig;

    constructor(config: SseConfig) {
        this.sseConfig = {
            eventType: 'notification',
            ...config,
        };
        this.userSessions = new Map();
    }

    async send(notifiable: Notifiable, message: SseMessage, _config?: SseConfig): Promise<SendResult> {
        let recipients: string[] = [];

        if (message.to) {
            recipients = Array.isArray(message.to) ? message.to : [message.to];
        } else {
            const route = notifiable.routeNotificationFor('sse') || notifiable.routeNotificationFor('inApp');
            if (Array.isArray(route)) {
                recipients = route as string[];
            } else if (route) {
                recipients = [route as string];
            } else if ((notifiable as any).id) {
                recipients = [(notifiable as any).id];
            }
        }

        if (recipients.length === 0) {
            throw new Error('RecipientMissing: No recipient found for SSE');
        }

        const notificationId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let sentCount = 0;
        const failedRecipients: string[] = [];

        const eventName = this.sseConfig.eventType || 'notification';

        for (const userId of recipients) {
            const sessions = this.userSessions.get(userId);
            if (sessions && sessions.size > 0) {
                try {
                    const eventData: SseNotificationEvent = {
                        id: notificationId,
                        userId,
                        title: message.title,
                        message: message.message,
                        type: message.type,
                        actionUrl: message.actionUrl,
                        icon: message.icon,
                        data: message.data,
                        timestamp: new Date().toISOString(),
                    };

                    // Send to all active sessions for this user
                    for (const session of sessions) {
                        try {
                            await session.push(eventData, eventName);
                            sentCount++;
                        } catch (err) {
                            Logger.error(`[SSE] Error sending to session for user ${userId}`, err);
                        }
                    }
                } catch (err) {
                    Logger.error(`[SSE] Error sending to user ${userId}`, err);
                    failedRecipients.push(userId);
                }
            } else {
                failedRecipients.push(userId);
            }
        }

        return {
            id: notificationId,
            status: sentCount > 0 ? 'success' : 'failed',
            response: {
                sentCount,
                failedRecipients,
                activeUsers: this.userSessions.size,
            },
        };
    }

    /**
     * Create an SSE session for a user
     * Call this from your HTTP route handler
     *
     * @example
     * ```typescript
     * app.get('/sse/:userId', async (req, res) => {
     *   const session = await sseDriver.createSession(req.params.userId, req, res);
     * });
     * ```
     */
    async createSession(userId: string, req: IncomingMessage, res: ServerResponse) {
        const session = await createSession(req, res);

        // Get or create session set for this user
        let sessions = this.userSessions.get(userId);
        if (!sessions) {
            sessions = new Set();
            this.userSessions.set(userId, sessions);
        }

        sessions.add(session);
        Logger.debug(`[SSE] User ${userId} connected. Active sessions: ${sessions.size}`);

        // Send initial connected event
        session.push({ connected: true, userId }, 'connected');

        // Clean up session when disconnected
        session.on('disconnected', () => {
            sessions?.delete(session);
            if (sessions && sessions.size === 0) {
                this.userSessions.delete(userId);
                Logger.debug(`[SSE] All sessions removed for user ${userId}`);
            }
        });

        return session;
    }

    /**
     * Get active connection count across all users
     */
    getConnectionCount(): number {
        let total = 0;
        for (const sessions of this.userSessions.values()) {
            total += sessions.size;
        }
        return total;
    }

    /**
     * Get sessions for a specific user
     */
    getUserSessions(userId: string): Set<any> | undefined {
        return this.userSessions.get(userId);
    }

    /**
     * Cleanup all sessions
     */
    async destroy(): Promise<void> {
        // Clear all sessions - they will be automatically cleaned up
        this.userSessions.clear();
        Logger.log('[SSE] All sessions destroyed');
    }
}
