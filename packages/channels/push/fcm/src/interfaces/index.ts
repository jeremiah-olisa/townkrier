/**
 * FCM message data
 */
export interface FcmMessageData {
  token?: string;
  tokens?: string[];
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  android?: {
    ttl?: number;
    collapseKey?: string;
    priority?: 'high' | 'normal';
    notification?: {
      icon?: string;
      color?: string;
      sound?: string;
      channelId?: string;
      imageUrl?: string;
      clickAction?: string;
      title?: string;
      body?: string;
    };
    data?: Record<string, string>;
  };
  apns?: {
    headers?: Record<string, string>;
    payload?: {
      aps?: {
        alert?: {
          title?: string;
          body?: string;
        };
        badge?: number;
        sound?: string;
        'mutable-content'?: number;
      };
    };
    fcmOptions?: {
      imageUrl?: string;
    };
  };
  webpush?: {
    headers?: Record<string, string>;
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
      image?: string;
      data?: any;
    };
    fcmOptions?: {
      link?: string;
    };
  };
}

/**
 * FCM send response
 */
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
