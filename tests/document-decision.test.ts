import assert from 'node:assert/strict';
import test from 'node:test';
import { decideDocument } from '../src/services/document-decision.js';
import type { BankTransaction } from '../src/domain/transaction.js';

const transaction: BankTransaction = {
  id: 'tx-1', tenantId: 'tenant-1', accountId: 'account-1', direction: 'CREDIT', amountMinor: 10_000,
  currency: 'TRY', bookedAt: '2026-01-01T00:00:00.000Z', description: 'Kapora ödemesi'
};

test('kapora için otomatik fatura oluşturmaz', () => {
  assert.deepEqual(decideDocument(transaction).classification, 'ADVANCE');
  assert.equal(decideDocument(transaction).createInvoiceDraft, false);
});

test('borç hareketi insan incelemesine gider', () => {
  assert.equal(decideDocument({ ...transaction, direction: 'DEBIT' }).classification, 'REVIEW_REQUIRED');
});
