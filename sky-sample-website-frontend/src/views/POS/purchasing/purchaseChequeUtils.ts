import type { Bank } from "../../../api/Settings/bankApi";

export function resolveBankName(banks: Bank[], bankId: number | null | undefined): string {
  if (bankId == null) return "";
  return banks.find((b) => b.id === bankId)?.name ?? "";
}

export function buildPurchaseChequeNotes(
  chequeNumber: string,
  bankName: string,
  extraNotes?: string | null
): string {
  const base = `Cheque ${chequeNumber.trim()} — ${bankName}`;
  const trimmed = extraNotes?.trim();
  return trimmed ? `${base}\n${trimmed}` : base;
}
