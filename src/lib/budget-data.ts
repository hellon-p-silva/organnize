export type Bill = { id: string; name: string; amount: number };

export type PayPeriod = {
  id: string;
  name: string;
  /** Dia do mês em que o dinheiro entra (1–31). */
  day: number | null;
  income: number;
  bills: Bill[];
};

/** Marca de pago: chave `${billId}:${mês}` → true. */
export type PaidMap = Record<string, boolean>;

export const MONTHS = [
  { key: '06', num: 6, label: 'Jun', full: 'junho' },
  { key: '07', num: 7, label: 'Jul', full: 'julho' },
  { key: '08', num: 8, label: 'Ago', full: 'agosto' },
  { key: '09', num: 9, label: 'Set', full: 'setembro' },
  { key: '10', num: 10, label: 'Out', full: 'outubro' },
  { key: '11', num: 11, label: 'Nov', full: 'novembro' },
  { key: '12', num: 12, label: 'Dez', full: 'dezembro' },
] as const;

export type MonthKey = (typeof MONTHS)[number]['key'];

export const paidKey = (billId: string, month: string) => `${billId}:${month}`;
