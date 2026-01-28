import { TermiiChannel } from './termii-channel';
import axios from 'axios';
import { SendSmsRequest } from 'townkrier-core';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TermiiChannel', () => {
  let channel: TermiiChannel;
  const config = {
    apiKey: 'test-api-key',
    from: 'Townkrier',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.create.mockReturnThis();
    mockedAxios.post.mockResolvedValue({
      data: { message_id: '12345', message: 'Successfully Sent' },
    });
    channel = new TermiiChannel(config);
  });

  it('should send single SMS via standard endpoint', async () => {
    const request: SendSmsRequest = {
      to: { phone: '2341234567890' },
      message: 'Hello World',
      text: 'Hello World',
    };

    await channel.sendSms(request);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/sms/send',
      expect.objectContaining({
        to: '2341234567890',
      }),
    );
  });

  it('should send bulk SMS via bulk endpoint', async () => {
    const request: SendSmsRequest = {
      to: [{ phone: '2341234567890' }, { phone: '2341234567891' }],
      message: 'Hello World Bulk',
      text: 'Hello World Bulk',
    };

    await channel.sendSms(request);

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/sms/send/bulk',
      expect.objectContaining({
        to: ['2341234567890', '2341234567891'],
      }),
    );
  });

  it('should throw error if API returns error message with 200 OK', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message: 'Invalid API Key',
      },
    });

    const request: SendSmsRequest = {
      to: { phone: '2341234567890' },
      message: 'Hello World',
      text: 'Hello World',
    };

    await expect(channel.sendSms(request)).resolves.toEqual(
      expect.objectContaining({
        status: 'failed',
        error: expect.objectContaining({
          message: 'Invalid API Key',
        }),
      }),
    );
  });
});
