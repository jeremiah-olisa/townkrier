import { WasenderAdapter, createWasenderAdapter } from '../src';
import { WasenderConfig } from '../src';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WasenderAdapter', () => {
  const config: WasenderConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://test.wasenderapi.com/api',
    senderId: 'TestSender',
  };

  let adapter: WasenderAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return the mocked axios instance
    (mockedAxios.create as jest.Mock).mockReturnValue(mockedAxios);
    adapter = new WasenderAdapter(config);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should create adapter with factory function', () => {
    const factoryAdapter = createWasenderAdapter(config);
    expect(factoryAdapter).toBeInstanceOf(WasenderAdapter);
  });

  it('should send message successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        message_id: 'msg-12345',
        id: 'msg-12345',
        status: 'sent',
      },
    });

    const result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Hello World',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      'send-message',
      expect.objectContaining({
        to: '+1234567890',
        text: 'Hello World',
      }),
    );

    expect(result.messageId).toBe('msg-12345');
    expect(result.status).toBe('SENT');
  });

  it('should handle send failure', async () => {
    mockedAxios.post.mockRejectedValue(new Error('API Error'));

    const result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Hello World',
    });

    expect(result.status).toBe('FAILED');
    expect(result.messageId).toBe('');
  });

  it('should validate request format', () => {
    expect(
      adapter.isValidNotificationRequest({
        to: { phone: '+1234567890' },
        text: 'Valid message',
      }),
    ).toBe(true);

    expect(
      adapter.isValidNotificationRequest({
        to: { phone: '' },
        text: 'Invalid phone',
      }),
    ).toBe(false);

    expect(
      adapter.isValidNotificationRequest({
        to: { phone: '+1234567890' },
        text: '',
      }),
    ).toBe(false);

    expect(adapter.isValidNotificationRequest({})).toBe(false);
  });
});
