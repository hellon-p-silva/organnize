import { useCallback } from 'react';
import { usePersistentState } from './use-persistent-state';
import {
  DEFAULT_WORKOUTS,
  type Exercise,
  type GuideImages,
  type WeightLog,
  type Workout,
  type WorkoutId,
} from '../lib/workout-data';
import { weekKey } from '../lib/dates';
import { uid } from '../lib/utils';

export function useWorkout() {
  const [workouts, setWorkouts] = usePersistentState<Workout[]>('workout:plans', DEFAULT_WORKOUTS);
  const [weights, setWeights] = usePersistentState<WeightLog>('workout:weights', {});
  const [guides, setGuides] = usePersistentState<GuideImages>('workout:guides', {});
  const thisWeek = weekKey();

  const updateWorkout = useCallback(
    (id: WorkoutId, patch: Partial<Omit<Workout, 'id' | 'exercises'>>) =>
      setWorkouts((ws) => ws.map((w) => (w.id === id ? { ...w, ...patch } : w))),
    [setWorkouts],
  );

  const addExercise = useCallback(
    (wid: WorkoutId) => {
      const id = uid();
      setWorkouts((ws) =>
        ws.map((w) => (w.id === wid ? { ...w, exercises: [...w.exercises, { id, name: '', sets: 3, reps: '10' }] } : w)),
      );
      return id;
    },
    [setWorkouts],
  );

  const updateExercise = useCallback(
    (wid: WorkoutId, eid: string, patch: Partial<Omit<Exercise, 'id'>>) =>
      setWorkouts((ws) =>
        ws.map((w) =>
          w.id === wid ? { ...w, exercises: w.exercises.map((e) => (e.id === eid ? { ...e, ...patch } : e)) } : w,
        ),
      ),
    [setWorkouts],
  );

  const removeExercise = useCallback(
    (wid: WorkoutId, eid: string) => {
      setWorkouts((ws) => ws.map((w) => (w.id === wid ? { ...w, exercises: w.exercises.filter((e) => e.id !== eid) } : w)));
      setWeights((log) => {
        const next = { ...log };
        delete next[eid];
        return next;
      });
    },
    [setWorkouts, setWeights],
  );

  const setWeight = useCallback(
    (eid: string, kg: number | null) =>
      setWeights((log) => {
        const ex = { ...(log[eid] ?? {}) };
        if (kg == null) delete ex[thisWeek];
        else ex[thisWeek] = kg;
        return { ...log, [eid]: ex };
      }),
    [setWeights, thisWeek],
  );

  /** Peso desta semana e o registro mais recente de semanas anteriores. */
  const compare = useCallback(
    (eid: string) => {
      const log = weights[eid] ?? {};
      const current = log[thisWeek];
      const prevWeek = Object.keys(log)
        .filter((k) => k < thisWeek)
        .sort()
        .pop();
      return { current, prev: prevWeek ? log[prevWeek] : undefined, prevWeek };
    },
    [weights, thisWeek],
  );

  const setGuide = useCallback(
    (wid: WorkoutId, dataUrl: string | null) =>
      setGuides((g) => {
        const next = { ...g };
        if (dataUrl) next[wid] = dataUrl;
        else delete next[wid];
        return next;
      }),
    [setGuides],
  );

  return { workouts, guides, thisWeek, updateWorkout, addExercise, updateExercise, removeExercise, setWeight, compare, setGuide };
}
