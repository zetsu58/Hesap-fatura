import { z } from 'zod';

export const BankTransactionSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  accountId: z.string().min(1),
  direction: z.enum(['CREDIT', 'DEBIT']),
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3).default('TRY'),
  bookedAt: z.string().datetime(),
  counterpartyName: z.string().optional(),
  counterpartyIban: z.string().optional(),
  description: z.string().default(''),
  bankReference: z.string().optional()
});

export type BankTransaction = z.infer<typeof BankTransactionSchema>;

export type TransactionClassification =
  | 'SALE_CANDIDATE'
  | 'INVOICE_PAYMENT'
  | 'ADVANCE'
  | 'INTERNAL_TRANSFER'
  | 'REFUND'
  | 'REVIEW_REQUIRED';
