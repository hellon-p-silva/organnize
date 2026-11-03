import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import { sortEvents, type AgendaEvent } from '../lib/agenda-data';
import { uid } from '../lib/utils';

export function useAgenda() {
  const [events, setEvents] = usePersistentState<AgendaEvent[]>('agenda:events', []);

  const byDay = useMemo(() => {
    const m: Record<string, AgendaEvent[]> = {};
    for (const e of events) (m[e.date] ??= []).push(e);
    for (const k of Object.keys(m)) m[k].sort(sortEvents);
    return m;
  }, [events]);

  const save = useCallback(
    (ev: Omit<AgendaEvent, 'id'> & { id?: string }) =>
      setEvents((xs) =>
        ev.id && xs.some((x) => x.id === ev.id)
          ? xs.map((x) => (x.id === ev.id ? ({ ...x, ...ev } as AgendaEvent) : x))
          : [...xs, { ...ev, id: uid() }],
      ),
    [setEvents],
  );

  const remove = useCallback((id: string) => setEvents((xs) => xs.filter((x) => x.id !== id)), [setEvents]);

  return { events, byDay, save, remove };
}
