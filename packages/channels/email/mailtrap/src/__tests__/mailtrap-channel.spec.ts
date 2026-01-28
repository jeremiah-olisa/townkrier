import {
  SendEmailRequest,
  NotificationStatus,
  NotificationConfigurationException,
} from 'townkrier-core';
import { MailtrapChannel } from '../core/mailtrap-channel';
import { MailtrapConfig } from '../types';
import { MailtrapClient } from 'mailtrap';

// Mock Mailtrap client
jest.mock('mailtrap');

describe('MailtrapChannel', () => {
  let channel: MailtrapChannel;
  let mockMailtrapSend: jest.Mock;
  const config: MailtrapConfig = {
    token: 'test-api-token',
    from: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMailtrapSend = jest.fn();
    (MailtrapClient as unknown as jest.Mock).mockImplementation(() => ({
      send: mockMailtrapSend,
    }));
    channel = new MailtrapChannel(config);
  });

  describe('constructor', () => {
    it('should throw if token is missing', () => {
      expect(() => new MailtrapChannel({ ...config, token: '' })).toThrow(
        NotificationConfigurationException,
      );
    });
  });

  describe('sendEmail', () => {
    const validRequest: SendEmailRequest = {
      to: [{ email: 'recipient@example.com' }],
      subject: 'Test Subject',
      html: '<p>Test Body</p>',
      from: { email: 'test@example.com' },
      message: '', // Deprecated but often present in SendEmailRequest
    };

    it('should send email successfully', async () => {
      mockMailtrapSend.mockResolvedValue({
        success: true,
        message_ids: ['msg-123'],
      });

      const response = await channel.sendEmail(validRequest);

      expect(response).toMatchObject({
        status: NotificationStatus.SENT,
        messageId: 'msg-123',
      });
      expect(mockMailtrapSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: { email: 'test@example.com', name: undefined },
          to: [{ email: 'recipient@example.com', name: undefined }],
          subject: 'Test Subject',
          html: '<p>Test Body</p>',
        }),
      );
    });

    it('should handle multiple recipients', async () => {
      mockMailtrapSend.mockResolvedValue({
        success: true,
        message_ids: ['msg-123'],
      });

      const requestWithMultipleRecipients: SendEmailRequest = {
        ...validRequest,
        to: [{ email: 'recipient1@example.com' }, { email: 'recipient2@example.com' }],
      };

      await channel.sendEmail(requestWithMultipleRecipients);

      expect(mockMailtrapSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [
            { email: 'recipient1@example.com', name: undefined },
            { email: 'recipient2@example.com', name: undefined },
          ],
        }),
      );
    });

    it('should use override from address if provided in request', async () => {
      mockMailtrapSend.mockResolvedValue({
        success: true,
        message_ids: ['msg-123'],
      });

      await channel.sendEmail({
        ...validRequest,
        from: { email: 'override@example.com', name: 'Override' },
      });

      expect(mockMailtrapSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: { email: 'override@example.com', name: 'Override' },
        }),
      );
    });

    it('should throw if from address is missing in config and request', async () => {
      const channelNoFrom = new MailtrapChannel({ token: 'key' });
      const requestNoFrom = {
        to: [{ email: 'recipient@example.com' }],
        subject: 'Subject',
        html: '<body></body>',
      } as any as SendEmailRequest;

      const response = await channelNoFrom.sendEmail(requestNoFrom);

      expect(response.status).toBe(NotificationStatus.FAILED);
      expect(response.error?.message).toContain('From email address is required');
    });

    it('should include cc and bcc if provided', async () => {
      mockMailtrapSend.mockResolvedValue({
        success: true,
        message_ids: ['msg-123'],
      });

      await channel.sendEmail({
        ...validRequest,
        cc: [{ email: 'cc@example.com' }],
        bcc: [{ email: 'bcc@example.com' }],
      });

      expect(mockMailtrapSend).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: [{ email: 'cc@example.com', name: undefined }],
          bcc: [{ email: 'bcc@example.com', name: undefined }],
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      (error as any).statusCode = 400;
      mockMailtrapSend.mockRejectedValue(error);

      const response = await channel.sendEmail(validRequest);

      expect(response.status).toBe(NotificationStatus.FAILED);
      expect(response.error?.code).toBe('MAILTRAP_ERROR');
      expect(response.error?.message).toBe('API Error');
    });

    it('should handle failed response from API', async () => {
      mockMailtrapSend.mockResolvedValue({
        success: false,
        message_ids: [],
        errors: ['Some error'], // Assuming Mailtrap client returns something like this on success: false
      });

      const response = await channel.sendEmail(validRequest);

      expect(response.status).toBe(NotificationStatus.FAILED);
      expect(response.error?.message).toContain('Mailtrap API reported failure');
    });
  });
});
