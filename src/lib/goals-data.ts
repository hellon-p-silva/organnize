import { addDays, fromKey, toKey } from './dates';

export type Goal = { id: string; name: string; current: number; target: number; unit: string };

export type Habit = { id: string; name: string; /** dias feitos (AAAA-MM-DD) */ done: string[] };

/** Sequência atual: dias seguidos até hoje (ou até ontem, se hoje ainda não foi marcado). */
export function currentStreak(done: string[], today: string): number {
  const set = new Set(done);
  let d = fromKey(today);
  if (!set.has(today)) d = addDays(d, -1);
  let n = 0;
  while (set.has(toKey(d))) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Maior sequência de dias seguidos já registrada. */
export function bestStreak(done: string[]): number {
  const days = [...new Set(done)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const k of days) {
    run = prev && toKey(addDays(fromKey(prev), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = k;
  }
  return best;
}
