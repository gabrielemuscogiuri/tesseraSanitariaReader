import { createTesseraSseServer } from './agent.js';

const host = '127.0.0.1';
const port = Number(process.env.PORT ?? 3847);
const corsOrigin = process.env.TESSERA_CORS_ORIGIN;

const agent = createTesseraSseServer({ host, port, corsOrigin });

const shutdown = () => {
  agent.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
