import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { loadEnvironment } from './config.js';
import { assertDatabase } from './db.js';
import { BankTransactionSchema } from './domain/transaction.js';
import { decideDocument } from './services/document-decision.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = loadEnvironment();
  const app = Fastify({
    logger: { redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'] },
    genReqId: (request) => String(request.headers['x-request-id'] ?? crypto.randomUUID()),
    requestIdHeader: 'x-request-id'
  });
  const origins = config.CORS_ORIGINS.split(',').map((value) => value.trim()).filter(Boolean);
  await app.register(cors, { origin: origins.length === 0 ? false : origins });

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'request failed');
    const validation = error instanceof ZodError;
    return reply.code(validation ? 400 : 500).send({
      error: { code: validation ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR', message: validation ? 'İstek geçersiz.' : 'Beklenmeyen bir hata oluştu.' },
      requestId: request.id
    });
  });

  app.get('/health', async () => ({ status: 'ok', service: 'hesapfatura-api' }));
  app.get('/ready', async (_request, reply) => {
    try {
      await assertDatabase();
      return { status: 'ready', database: 'up' };
    } catch {
      return reply.code(503).send({ status: 'not_ready', database: 'down' });
    }
  });
  app.post('/v1/transactions/decision', async (request, reply) => {
    const parsed = BankTransactionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: { code: 'INVALID_TRANSACTION', message: 'Banka hareketi geçersiz.', details: parsed.error.flatten() }, requestId: request.id });
    }
    return { transactionId: parsed.data.id, decision: decideDocument(parsed.data) };
  });
  return app;
}
