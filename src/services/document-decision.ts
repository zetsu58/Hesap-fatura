import type { BankTransaction, TransactionClassification } from '../domain/transaction.js';

export type DocumentDecision = {
  classification: TransactionClassification;
  createInvoiceDraft: boolean;
  requiresHumanApproval: boolean;
  reasons: string[];
};

const internalTransferWords = ['virman', 'hesaplar arasi', 'hesaplar arası'];
const advanceWords = ['avans', 'kapora'];
const refundWords = ['iade'];

export function decideDocument(tx: BankTransaction): DocumentDecision {
  if (tx.direction !== 'CREDIT') {
    return {
      classification: 'REVIEW_REQUIRED',
      createInvoiceDraft: false,
      requiresHumanApproval: true,
      reasons: ['V1 otomatik belge kararı yalnızca hesaba gelen hareketler için çalışır.']
    };
  }

  const text = tx.description.toLocaleLowerCase('tr-TR');

  if (internalTransferWords.some((word) => text.includes(word))) {
    return {
      classification: 'INTERNAL_TRANSFER',
      createInvoiceDraft: false,
      requiresHumanApproval: false,
      reasons: ['Açıklama hesaplar arası transfer göstergesi içeriyor.']
    };
  }

  if (advanceWords.some((word) => text.includes(word))) {
    return {
      classification: 'ADVANCE',
      createInvoiceDraft: false,
      requiresHumanApproval: true,
      reasons: ['Avans/kapora tahsilatı satış faturası olarak otomatik belgelenmedi.']
    };
  }

  if (refundWords.some((word) => text.includes(word))) {
    return {
      classification: 'REFUND',
      createInvoiceDraft: false,
      requiresHumanApproval: true,
      reasons: ['İade ifadesi tespit edildi.']
    };
  }

  return {
    classification: 'SALE_CANDIDATE',
    createInvoiceDraft: true,
    requiresHumanApproval: true,
    reasons: ['Gelen hareket satış adayı; cari/açık belge eşleşmesi tamamlanmadan fatura gönderilmez.']
  };
}
