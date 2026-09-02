import Fastify from 'fastify';
import cors from '@fastify/cors';
import { BankTransactionSchema } from './domain/transaction.js';
import { decideDocument } from './services/document-decision.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: false });

app.get('/health', async () => ({ status: 'ok', service: 'hesapfatura-api' }));

app.post('/v1/transactions/decision', async (request, reply) => {
  const parsed = BankTransactionSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({
      error: 'INVALID_TRANSACTION',
      details: parsed.error.flatten()
    });
  }

  return {
    transactionId: parsed.data.id,
    decision: decideDocument(parsed.data)
  };
});

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '0.0.0.0';

await app.listen({ port, host });
