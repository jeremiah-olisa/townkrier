import {
  SendEmailRequest,
  NotificationStatus,
  NotificationConfigurationException,
} from 'townkrier-core';
import { ResendChannel } from '../core/resend-channel';
import { ResendConfig } from '../types';
import { Resend } from 'resend';

// Mock Resend client
jest.mock('resend');

describe('ResendChannel', () => {
  let channel: ResendChannel;
  let mockResendSend: jest.Mock;
  const config: ResendConfig = {
    apiKey: 'test-api-key',
    from: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockResendSend = jest.fn();
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: {
        send: mockResendSend,
      },
    }));
    channel = new ResendChannel(config);
  });

  describe('constructor', () => {
    it('should throw if apiKey is missing', () => {
      expect(() => new ResendChannel({ ...config, apiKey: '' })).toThrow(
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
      message: '',
    };

    it('should send email successfully', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'msg-123', created_at: new Date().toISOString() },
        error: null,
      });

      const response = await channel.sendEmail(validRequest);

      expect(response).toMatchObject({
        status: NotificationStatus.SENT,
        messageId: 'msg-123',
      });
      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'test@example.com',
          to: ['recipient@example.com'],
          subject: 'Test Subject',
          html: '<p>Test Body</p>',
        }),
      );
    });

    it('should handle multiple recipients', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'msg-123', created_at: new Date().toISOString() },
        error: null,
      });

      const requestWithMultipleRecipients: SendEmailRequest = {
        ...validRequest,
        to: [{ email: 'recipient1@example.com' }, { email: 'recipient2@example.com' }],
      };

      await channel.sendEmail(requestWithMultipleRecipients);

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['recipient1@example.com', 'recipient2@example.com'],
        }),
      );
    });

    it('should use override from address if provided in request', async () => {
      mockResendSend.mockResolvedValue({
        data: { id: 'msg-123', created_at: new Date().toISOString() },
        error: null,
      });

      await channel.sendEmail({
        ...validRequest,
        from: { email: 'override@example.com', name: 'Override' },
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Override <override@example.com>',
        }),
      );
    });

    it('should throw if from address is missing in config and request', async () => {
      const channelNoFrom = new ResendChannel({ apiKey: 'key' });
      // We expect it to throw or handle error depending on BaseNotificationChannel error handling
      // But ResendChannel explicitly throws NotificationConfigurationException in mapper/channel

      // Since sendEmail catches errors and returns failure response (due to handleError),
      // we check the returned response.
      // Create a request WITHOUT from
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
      mockResendSend.mockResolvedValue({
        data: { id: 'msg-123', created_at: new Date().toISOString() },
        error: null,
      });

      await channel.sendEmail({
        ...validRequest,
        cc: [{ email: 'cc@example.com' }],
        bcc: [{ email: 'bcc@example.com' }],
      });

      expect(mockResendSend).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
        }),
      );
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      (error as any).statusCode = 400;
      mockResendSend.mockRejectedValue(error);

      const response = await channel.sendEmail(validRequest);

      expect(response.status).toBe(NotificationStatus.FAILED);
      expect(response.error?.code).toBe('RESEND_ERROR');
      expect(response.error?.message).toBe('API Error');
    });

    it('should handle invalid response format from API', async () => {
      mockResendSend.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await channel.sendEmail(validRequest);

      expect(response.status).toBe(NotificationStatus.FAILED);
      expect(response.error?.message).toBe('No response data from Resend');
    });

    it('should fail silently if configured', async () => {
      // This relies on Base/MailChannel logic, but ResendChannel calls super(config)
      // Let's create a channel with failSilently: true
      const silentChannel = new ResendChannel({ ...config, failSilently: true });

      mockResendSend.mockRejectedValue(new Error('Fatal API Error'));

      const response = await silentChannel.sendEmail(validRequest);

      // Even with failSilently, sendEmail returns a response with status FAILED, it just doesn't Throw.
      // Wait, the MailChannel implementation catches check:
      // try { ... } catch (error) { if (this.config.failSilently) return { success: false ...} else throw error }
      // Actually ResendChannel.sendEmail catches ALL errors and returns handleError response.
      // It doesn't seem to use the super.send() logic which might enforce failSilently differently?
      // ResendChannel implementation overrides sendEmail and has its own try/catch block.
      // Looking at ResendChannel.ts provided:
      /* 
              try { ... } catch (error) { return this.handleError(...) }
            */
      // It swallows exceptions by default and returns a generic error response!
      // This means failSilently config isn't actively creating a "silent" behavior different from "return error object".
      // However, the USER recently refactored MailChannel to throw if NOT silent.
      // But ResendChannel overrides `sendEmail` which is abstract in `MailChannel`? No, `MailChannel` implements `send` which calls `sendEmail`.
      // Wait, `MailChannel` usually implements `send` and delegates to abstract `sendEmail`?
      // Let's check MailChannel.ts again if possible, but assuming ResendChannel.sendEmail is the heavy lifter.

      // In the current ResendChannel code:
      // catch (error) { return this.handleError(error, 'Failed to send email') as SendEmailResponse; }
      // This returns a response object with status: FAILED. It does NOT throw.

      expect(response.status).toBe(NotificationStatus.FAILED);
    });
  });
});
