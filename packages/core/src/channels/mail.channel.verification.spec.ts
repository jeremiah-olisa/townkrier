import { MailChannel } from './mail.channel';
import { SendEmailRequest, SendEmailResponse } from '../interfaces';
import { NotificationChannelConfig } from '../interfaces/notification-config.interface';
import { NotificationStatus } from '../types';

class TestMailChannel extends MailChannel {
  async sendEmail(_request: SendEmailRequest): Promise<SendEmailResponse> {
    return {
      status: NotificationStatus.FAILED,
      messageId: `0`,
    };
  }
}

describe('MailChannel Verification', () => {
  const config: NotificationChannelConfig = { apiKey: 'test' };

  it('should fail silently and return failure response when failSilently is true (default)', async () => {
    const channelSilent = new TestMailChannel(config, 'TestSilent', { failSilently: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await channelSilent.send({ not: 'an email request' } as any);

    // expect(result.success).toBe(false);
    expect(result.status).toBe('failed');
    if ('error' in result) {
      expect(result.error?.code).toBe('UNSUPPORTED_NOTIFICATION_TYPE');
    }
  });

  it('should throw exception when failSilently is false', async () => {
    const channelThrow = new TestMailChannel(config, 'TestThrow', { failSilently: false });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(channelThrow.send({ not: 'an email request' } as any)).rejects.toThrow(
      'TestThrow only supports email notifications',
    );
  });
});
