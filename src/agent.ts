import http from 'node:http';
import type { WatchHandle } from './types.js';
import { watchTesseraSanitaria } from './watch.js';

export type AgentOptions = {
  host?: string;
  port?: number;
  corsOrigin?: string;
};

export type AgentHandle = {
  close: () => void;
};

const resolveOrigin = (req: http.IncomingMessage, fixed?: string): string =>
  fixed ?? req.headers.origin ?? '*';

const corsHeaders = (req: http.IncomingMessage, corsOrigin?: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': resolveOrigin(req, corsOrigin),
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
});

export const createTesseraSseServer = (opts: AgentOptions = {}): AgentHandle => {
  const host = opts.host ?? '127.0.0.1';
  const port = opts.port ?? 3847;
  const corsOrigin = opts.corsOrigin;

  type SseClient = http.ServerResponse;
  const clients = new Set<SseClient>();

  const send = (client: SseClient, event: unknown): void => {
    client.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  const broadcast = (event: unknown): void => {
    [...clients].forEach((client) => send(client, event));
  };

  const watchHandle: WatchHandle = watchTesseraSanitaria({
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

  const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders(req, corsOrigin));
      res.end();
      return;
    }

    if (req.url === '/health') {
      res.writeHead(200, { ...corsHeaders(req, corsOrigin), 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.url === '/events') {
      res.writeHead(200, {
        ...corsHeaders(req, corsOrigin),
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

    res.writeHead(404, corsHeaders(req, corsOrigin));
    res.end();
  });

  server.listen(port, host, () => {
    console.log(`tessera-sanitaria-agent running on http://${host}:${port}/events`);
  });

  return {
    close: () => {
      watchHandle.close();
      server.close();
    },
  };
};
