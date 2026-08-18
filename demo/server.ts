import http from 'node:http';
import { watchTesseraSanitaria } from '../src/index.js';

const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT ?? 3847);

type SseClient = http.ServerResponse;
const clients = new Set<SseClient>();

const send = (client: SseClient, event: unknown): void => {
  client.write(`data: ${JSON.stringify(event)}\n\n`);
};

const broadcast = (event: unknown): void => {
  [...clients].forEach((client) => send(client, event));
};

const handle = watchTesseraSanitaria({
  onReader: (readerName) => {
    console.log('Lettore rilevato:', readerName);
    broadcast({ type: 'reader', readerName });
  },
  onCard: (data, meta) => {
    console.log('Carta letta da', meta.readerName);
    broadcast({ type: 'card', data, readerName: meta.readerName });
  },
  onRemove: (meta) => {
    console.log('Carta rimossa');
    broadcast({ type: 'remove', readerName: meta.readerName });
  },
  onError: (error) => {
    console.error('Errore:', error.message);
    broadcast({ type: 'error', message: error.message });
  },
});

const corsHeaders = (req: http.IncomingMessage): Record<string, string> => ({
  'Access-Control-Allow-Origin': req.headers.origin ?? '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
});

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  if (req.url === '/events') {
    res.writeHead(200, {
      ...corsHeaders(req),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    clients.add(res);
    send(res, { type: 'hello' });
    req.on('close', () => {
      clients.delete(res);
    });
    return;
  }

  res.writeHead(404, corsHeaders(req));
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`SSE agent on http://${HOST}:${PORT}/events`);
});

const shutdown = () => {
  handle.close();
  server.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
