import { TermiiChannel, createTermiiChannel } from '../src/core';
import { TermiiConfig } from '../src/types';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TermiiChannel', () => {
  const config: TermiiConfig = {
    apiKey: 'test-api-key',
    from: 'TestSender',
  };

  let channel: TermiiChannel;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return the mocked axios instance so we can spy on post
    (mockedAxios.create as jest.Mock).mockReturnValue(mockedAxios);
    channel = new TermiiChannel(config);
  });

  it('should be defined', () => {
    expect(channel).toBeDefined();
  });

  it('should send sms successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message_id: '12345',
        message: 'Successfully Sent',
        balance: 10,
        user: 'test-user',
      },
    });

    const result = await channel.sendSms({
      to: { phone: '2348012345678' },
      message: 'Hello World',
      text: 'Hello World',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/api/sms/send', // Method uses relative path on client
      expect.objectContaining({
        api_key: 'test-api-key',
        to: '2348012345678',
        from: 'TestSender',
        sms: 'Hello World',
        type: 'plain',
        channel: 'generic',
      }),
    );

    expect(result.status).toBe('sent');
    expect(result.messageId).toBe('12345');
  });

  it('should create channel using factory', () => {
    const channelFromFactory = createTermiiChannel(config);
    expect(channelFromFactory).toBeInstanceOf(TermiiChannel);
  });
});
