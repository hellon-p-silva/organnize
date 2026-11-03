import type { ColorKey } from './colors';
import { addDays, toKey } from './dates';

export type AgendaEvent = {
  id: string;
  date: string; // AAAA-MM-DD
  time: string; // HH:MM ou ''
  title: string;
  notes: string;
  color: ColorKey;
};

/** 42 dias (6 semanas, começando no domingo) cobrindo o mês. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(start, i);
    return { date: d, key: toKey(d), inMonth: d.getMonth() === month };
  });
}

export const sortEvents = (a: AgendaEvent, b: AgendaEvent) =>
  (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title);
