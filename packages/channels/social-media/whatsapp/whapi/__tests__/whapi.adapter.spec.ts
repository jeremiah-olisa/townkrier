import { WhapiAdapter, createWhapiAdapter } from '../src';
import { WhapiConfig } from '../src';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhapiAdapter', () => {
  const config: WhapiConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://test.whapi.cloud',
  };

  let adapter: WhapiAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return the mocked axios instance
    (mockedAxios.create as jest.Mock).mockReturnValue(mockedAxios);
    adapter = new WhapiAdapter(config);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  it('should create adapter with factory function', () => {
    const factoryAdapter = createWhapiAdapter(config);
    expect(factoryAdapter).toBeInstanceOf(WhapiAdapter);
  });

  it('should send message successfully', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        sent: true,
        message: {
          id: 'msg-12345',
          message_id: 'msg-12345',
        },
      },
    });

    const result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Hello World',
    });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      '/messages/text',
      expect.objectContaining({
        to: '+1234567890',
        body: 'Hello World',
      }),
    );

    expect(result.messageId).toBe('msg-12345');
    expect(result.status).toBe('SENT');
  });

  it('should handle send failure when sent is false', async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        sent: false,
        message: {
          id: 'msg-12345',
        },
      },
    });

    const result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Hello World',
    });

    expect(result.status).toBe('FAILED');
    expect(result.messageId).toBe('msg-12345');
  });

  it('should handle API error', async () => {
    const axiosError = {
      response: {
        data: {
          error: {
            message: 'Invalid API key',
          },
        },
      },
    };
    mockedAxios.post.mockRejectedValue(axiosError);

    const result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Hello World',
    });

    expect(result.status).toBe('FAILED');
    expect(result.messageId).toBe('');
  });

  it('should handle network error', async () => {
    mockedAxios.post.mockRejectedValue(new Error('Network timeout'));

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

  it('should extract message ID from various response formats', async () => {
    // Test message.id
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        sent: true,
        message: { id: 'id-from-message' },
      },
    });

    let result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Test',
    });
    expect(result.messageId).toBe('id-from-message');

    // Test message.message_id
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        sent: true,
        message: { message_id: 'id-from-message-id' },
      },
    });

    result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Test',
    });
    expect(result.messageId).toBe('id-from-message-id');

    // Test root level id
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        sent: true,
        id: 'root-id',
      },
    });

    result = await adapter.send({
      to: { phone: '+1234567890' },
      text: 'Test',
    });
    expect(result.messageId).toBe('root-id');
  });
});
