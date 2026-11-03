import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import { sortNotes, type Note } from '../lib/notes-data';
import { uid } from '../lib/utils';

const norm = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function useNotes(query: string) {
  const [notes, setNotes] = usePersistentState<Note[]>('notes:items', []);

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return notes.filter((n) => !q || norm(`${n.title} ${n.body}`).includes(q)).sort(sortNotes);
  }, [notes, query]);

  const create = useCallback(() => {
    const id = uid();
    setNotes((xs) => [...xs, { id, title: '', body: '', color: 'ember', pinned: false, updatedAt: Date.now() }]);
    return id;
  }, [setNotes]);

  const update = useCallback(
    (id: string, patch: Partial<Omit<Note, 'id' | 'updatedAt'>>) =>
      setNotes((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x))),
    [setNotes],
  );

  const remove = useCallback((id: string) => setNotes((xs) => xs.filter((x) => x.id !== id)), [setNotes]);

  return { notes, visible, create, update, remove };
}
