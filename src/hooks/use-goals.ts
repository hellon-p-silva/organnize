import { useCallback } from 'react';
import { usePersistentState } from './use-persistent-state';
import { useToday } from './use-today';
import type { Goal, Habit } from '../lib/goals-data';
import { uid } from '../lib/utils';

export function useGoals() {
  const today = useToday();
  const [goals, setGoals] = usePersistentState<Goal[]>('goals:goals', []);
  const [habits, setHabits] = usePersistentState<Habit[]>('goals:habits', []);

  const addGoal = useCallback(() => {
    const id = uid();
    setGoals((g) => [...g, { id, name: '', current: 0, target: 10, unit: '' }]);
    return id;
  }, [setGoals]);
  const updateGoal = useCallback(
    (id: string, patch: Partial<Omit<Goal, 'id'>>) => setGoals((g) => g.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setGoals],
  );
  const increment = useCallback(
    (id: string, by = 1) => setGoals((g) => g.map((x) => (x.id === id ? { ...x, current: Math.max(0, (x.current || 0) + by) } : x))),
    [setGoals],
  );
  const removeGoal = useCallback((id: string) => setGoals((g) => g.filter((x) => x.id !== id)), [setGoals]);

  const addHabit = useCallback(() => {
    const id = uid();
    setHabits((h) => [...h, { id, name: '', done: [] }]);
    return id;
  }, [setHabits]);
  const renameHabit = useCallback(
    (id: string, name: string) => setHabits((h) => h.map((x) => (x.id === id ? { ...x, name } : x))),
    [setHabits],
  );
  const toggleDay = useCallback(
    (id: string, day: string) =>
      setHabits((h) =>
        h.map((x) =>
          x.id !== id ? x : { ...x, done: x.done.includes(day) ? x.done.filter((d) => d !== day) : [...x.done, day] },
        ),
      ),
    [setHabits],
  );
  const removeHabit = useCallback((id: string) => setHabits((h) => h.filter((x) => x.id !== id)), [setHabits]);

  return { today, goals, habits, addGoal, updateGoal, increment, removeGoal, addHabit, renameHabit, toggleDay, removeHabit };
}
