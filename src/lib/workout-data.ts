import type { ColorKey } from './colors';

export type WorkoutId = 'A' | 'B' | 'C';

export type Exercise = { id: string; name: string; sets: number | null; reps: string };

export type Workout = { id: WorkoutId; name: string; color: ColorKey; exercises: Exercise[] };

/** Peso usado por exercício e semana: exerciseId → (segunda-feira AAAA-MM-DD → kg). */
export type WeightLog = Record<string, Record<string, number>>;

/** Imagens-guia enviadas pelo usuário (data URL), por treino. */
export type GuideImages = Partial<Record<WorkoutId, string>>;

export const DEFAULT_WORKOUTS: Workout[] = [
  { id: 'A', name: 'Treino A', color: 'ember', exercises: [] },
  { id: 'B', name: 'Treino B', color: 'sky', exercises: [] },
  { id: 'C', name: 'Treino C', color: 'mint', exercises: [] },
];

/** Imagem padrão opcional em public/guia/treino-a.jpg (b, c). */
export const defaultGuideSrc = (id: WorkoutId) => `./guia/treino-${id.toLowerCase()}.jpg`;

export const REST_PRESETS = [30, 60, 90, 120, 180];
