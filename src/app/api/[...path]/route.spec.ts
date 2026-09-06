/**
 * @jest-environment node
 */

import { GET } from './route';
import { NextRequest } from 'next/server';

describe('API catch-all proxy', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('strips content-encoding and content-length after Node fetch decompression', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ totalContracts: 1 }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'content-encoding': 'br',
          'content-length': '999',
          'transfer-encoding': 'chunked',
        },
      }),
    );

    const req = new NextRequest('http://front.test/api/dashboard/stats', {
      headers: { cookie: 'sid=1' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-encoding')).toBeNull();
    expect(res.headers.get('content-length')).toBeNull();
    expect(res.headers.get('transfer-encoding')).toBeNull();
    expect(res.headers.get('content-type')).toMatch(/application\/json/);
    await expect(res.json()).resolves.toEqual({ totalContracts: 1 });
  });

  it('sends Accept-Encoding: identity to upstream', async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response('{}', { status: 200 }));

    const req = new NextRequest('http://front.test/api/impact/trends', {
      headers: { 'accept-encoding': 'gzip, deflate, br' },
    });
    await GET(req);

    expect(global.fetch).toHaveBeenCalled();
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const outbound = new Headers(init.headers);
    expect(outbound.get('accept-encoding')).toBe('identity');
  });
});
