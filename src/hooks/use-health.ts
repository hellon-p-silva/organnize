import { useCallback } from 'react';
import { usePersistentState } from './use-persistent-state';
import { EMPTY_DAY, type HealthDay, type HealthLog } from '../lib/health-data';
import { addDays, fromKey, toKey } from '../lib/dates';

export function useHealth() {
  const [log, setLog] = usePersistentState<HealthLog>('health:log', {});

  const get = useCallback((day: string): HealthDay => ({ ...EMPTY_DAY, ...(log[day] ?? {}) }), [log]);

  const update = useCallback(
    (day: string, patch: Partial<HealthDay>) =>
      setLog((l) => ({ ...l, [day]: { ...EMPTY_DAY, ...(l[day] ?? {}), ...patch } })),
    [setLog],
  );

  /** Últimos 7 dias terminando em `endDay`. */
  const series = useCallback(
    (endDay: string, field: 'weight' | 'sleep') =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(fromKey(endDay), i - 6);
        const k = toKey(d);
        const v = log[k]?.[field];
        return { key: k, date: d, value: typeof v === 'number' ? v : null };
      }),
    [log],
  );

  return { get, update, series };
}
