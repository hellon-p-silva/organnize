import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import { useToday } from './use-today';
import type { Subject, StudySession } from '../lib/study-data';
import { COLOR_KEYS } from '../lib/colors';
import { addDays, fromKey, toKey, weekKey } from '../lib/dates';
import { sum, uid } from '../lib/utils';

export function useStudy() {
  const today = useToday();
  const [subjects, setSubjects] = usePersistentState<Subject[]>('study:subjects', []);
  const [sessions, setSessions] = usePersistentState<StudySession[]>('study:sessions', []);

  const weekStart = weekKey(fromKey(today));
  const weekEnd = toKey(addDays(fromKey(weekStart), 6));

  const weekMinutes = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sessions) if (s.date >= weekStart && s.date <= weekEnd) m[s.subjectId] = (m[s.subjectId] ?? 0) + s.minutes;
    return m;
  }, [sessions, weekStart, weekEnd]);

  const todaySessions = useMemo(
    () => sessions.filter((s) => s.date === today).sort((a, b) => b.at - a.at),
    [sessions, today],
  );

  const addSubject = useCallback(() => {
    const id = uid();
    setSubjects((xs) => [...xs, { id, name: '', color: COLOR_KEYS[xs.length % COLOR_KEYS.length], weeklyGoal: 300 }]);
    return id;
  }, [setSubjects]);

  const updateSubject = useCallback(
    (id: string, patch: Partial<Omit<Subject, 'id'>>) =>
      setSubjects((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setSubjects],
  );

  const removeSubject = useCallback(
    (id: string) => {
      setSubjects((xs) => xs.filter((x) => x.id !== id));
      setSessions((xs) => xs.filter((s) => s.subjectId !== id));
    },
    [setSubjects, setSessions],
  );

  const logSession = useCallback(
    (subjectId: string, minutes: number) =>
      setSessions((xs) => [...xs, { id: uid(), subjectId, date: today, minutes, at: Date.now() }]),
    [setSessions, today],
  );

  const removeSession = useCallback((id: string) => setSessions((xs) => xs.filter((s) => s.id !== id)), [setSessions]);

  return {
    today,
    subjects,
    weekMinutes,
    weekTotal: sum(Object.values(weekMinutes)),
    todaySessions,
    todayTotal: sum(todaySessions.map((s) => s.minutes)),
    addSubject,
    updateSubject,
    removeSubject,
    logSession,
    removeSession,
  };
}
