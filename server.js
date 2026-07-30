const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const httpProxy = require('http-proxy');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:3001',
  ws: true,
  changeOrigin: true,
});

proxy.on('error', (err, req, res) => {
  if (res && typeof res.writeHead === 'function') {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway');
  } else {
    console.error('[proxy:ws] WebSocket proxy error:', err.message);
  }
});

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    const parsed = parse(req.url, true);
    if (parsed.pathname && parsed.pathname.startsWith('/ws')) {
      proxy.ws(req, socket, head);
    } else {
      try {
        app.getUpgradeHandler()(req, socket, head);
      } catch {
        socket.destroy();
      }
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
