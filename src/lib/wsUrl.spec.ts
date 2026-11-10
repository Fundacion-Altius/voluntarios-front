import { deriveWsUrl } from './wsUrl';

describe('deriveWsUrl', () => {
  const originalWs = process.env.NEXT_PUBLIC_WS_BASE_URL;
  const originalApi = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalWs === undefined) delete process.env.NEXT_PUBLIC_WS_BASE_URL;
    else process.env.NEXT_PUBLIC_WS_BASE_URL = originalWs;
    if (originalApi === undefined) delete process.env.NEXT_PUBLIC_API_URL;
    else process.env.NEXT_PUBLIC_API_URL = originalApi;
  });

  it('prefers NEXT_PUBLIC_WS_BASE_URL and appends /ws', () => {
    process.env.NEXT_PUBLIC_WS_BASE_URL = 'https://ws.example.com';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';
    expect(deriveWsUrl()).toBe('wss://ws.example.com/ws');
  });

  it('accepts an already-ws explicit base', () => {
    process.env.NEXT_PUBLIC_WS_BASE_URL = 'wss://ws.example.com:8443';
    expect(deriveWsUrl()).toBe('wss://ws.example.com:8443/ws');
  });

  it('falls back to NEXT_PUBLIC_API_URL host (not the Next front host)', () => {
    delete process.env.NEXT_PUBLIC_WS_BASE_URL;
    process.env.NEXT_PUBLIC_API_URL = 'https://voluntarios-v2-back.example.com';
    expect(deriveWsUrl()).toBe('wss://voluntarios-v2-back.example.com/ws');
  });

  it('maps http API URL to ws', () => {
    delete process.env.NEXT_PUBLIC_WS_BASE_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    expect(deriveWsUrl()).toBe('ws://localhost:3001/ws');
  });

  it('defaults to local backend when env is unset', () => {
    delete process.env.NEXT_PUBLIC_WS_BASE_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(deriveWsUrl()).toBe('ws://localhost:3001/ws');
  });
});
