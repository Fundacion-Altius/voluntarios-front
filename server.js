const { createServer, request: httpRequest } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const BACKEND_HOST = 'localhost';
const BACKEND_PORT = 3001;

function headerBlock(headers) {
  return Object.entries(headers)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}\r\n`)
    .join('');
}

/**
 * Proxy a browser WebSocket upgrade to the API. Must use http.request's
 * `upgrade` event (not raw net.connect + pipe-after-write): otherwise the
 * 101 response can arrive before pipes attach, the browser aborts, and the
 * notification hook reconnects every 5s.
 */
function proxyRealtimeUpgrade(req, clientSocket, head) {
  const proxyReq = httpRequest({
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: req.url,
    method: req.method || 'GET',
    headers: req.headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    clientSocket.write(`HTTP/1.1 101 Switching Protocols\r\n${headerBlock(proxyRes.headers)}\r\n`);
    if (proxyHead && proxyHead.length) clientSocket.write(proxyHead);
    if (head && head.length) proxySocket.write(head);

    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);

    proxySocket.on('error', () => clientSocket.destroy());
    clientSocket.on('error', () => proxySocket.destroy());
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy:ws] Backend error:', err.code || err.message);
    clientSocket.destroy();
  });

  proxyReq.on('response', (res) => {
    res.destroy();
    clientSocket.end();
  });

  proxyReq.end();
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.on('upgrade', (req, clientSocket, head) => {
    const parsed = parse(req.url, true);
    const pathname = parsed.pathname || '';
    const isRealtimeWs = pathname.startsWith('/ws') || /^\/(es|ca|en)\/ws(\/|$)/.test(pathname);

    if (!isRealtimeWs) {
      try {
        app.getUpgradeHandler()(req, clientSocket, head);
      } catch {
        clientSocket.destroy();
      }
      return;
    }

    proxyRealtimeUpgrade(req, clientSocket, head);
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
