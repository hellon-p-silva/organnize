import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import { useToday } from './use-today';
import { sortByTime, type RoutineChecks, type RoutineItem } from '../lib/routine-data';
import { uid } from '../lib/utils';

export function useRoutine() {
  const today = useToday();
  const [items, setItems] = usePersistentState<RoutineItem[]>('routine:items', []);
  const [checks, setChecks] = usePersistentState<RoutineChecks>('routine:checks', {});

  const sorted = useMemo(() => sortByTime(items), [items]);
  const doneToday = useMemo(() => new Set(checks[today] ?? []), [checks, today]);
  const done = items.filter((i) => doneToday.has(i.id)).length;

  const add = useCallback(() => {
    const id = uid();
    setItems((xs) => [...xs, { id, time: '', name: '' }]);
    return id;
  }, [setItems]);

  const update = useCallback(
    (id: string, patch: Partial<Omit<RoutineItem, 'id'>>) =>
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((xs) => xs.filter((x) => x.id !== id));
      setChecks((c) => {
        const next: RoutineChecks = {};
        for (const [k, ids] of Object.entries(c)) next[k] = ids.filter((x) => x !== id);
        return next;
      });
    },
    [setItems, setChecks],
  );

  const toggle = useCallback(
    (id: string) =>
      setChecks((c) => {
        const cur = new Set(c[today] ?? []);
        if (cur.has(id)) cur.delete(id);
        else cur.add(id);
        return { ...c, [today]: [...cur] };
      }),
    [setChecks, today],
  );

  const clearToday = useCallback(() => setChecks((c) => ({ ...c, [today]: [] })), [setChecks, today]);

  return {
    today,
    items: sorted,
    isDone: (id: string) => doneToday.has(id),
    progress: { done, total: items.length, pct: items.length ? done / items.length : 0 },
    add,
    update,
    remove,
    toggle,
    clearToday,
  };
}
