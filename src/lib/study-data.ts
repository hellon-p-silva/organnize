import type { ColorKey } from './colors';

export type Subject = { id: string; name: string; color: ColorKey; /** minutos por semana */ weeklyGoal: number };

export type StudySession = { id: string; subjectId: string; date: string; minutes: number; at: number };

export type PomodoroMode = 'focus' | 'short' | 'long';

export const POMODORO: Record<PomodoroMode, { label: string; minutes: number }> = {
  focus: { label: 'Foco', minutes: 25 },
  short: { label: 'Pausa curta', minutes: 5 },
  long: { label: 'Pausa longa', minutes: 15 },
};

export const fmtMinutes = (m: number) => {
  const h = Math.floor(m / 60);
  const r = Math.round(m % 60);
  return h ? (r ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`) : `${r} min`;
};
