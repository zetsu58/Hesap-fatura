import { buildApp } from './app.js';
import { loadEnvironment } from './config.js';
import { db } from './db.js';

const config = loadEnvironment();
const app = await buildApp();
let closing = false;
const shutdown = async (signal: string): Promise<void> => {
  if (closing) return;
  closing = true;
  app.log.info({ signal }, 'graceful shutdown started');
  await app.close();
  await db?.end();
};
process.once('SIGTERM', () => void shutdown('SIGTERM'));
process.once('SIGINT', () => void shutdown('SIGINT'));
await app.listen({ port: config.PORT, host: config.HOST });
