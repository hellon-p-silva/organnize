export type HealthDay = {
  water: number;
  sleep: number | null;
  weight: number | null;
  mood: number | null;
};

export type HealthLog = Record<string, HealthDay>;

export const WATER_GOAL = 8;

export const EMPTY_DAY: HealthDay = { water: 0, sleep: null, weight: null, mood: null };

export const MOODS = [
  { value: 1, emoji: '😢', label: 'Muito mal' },
  { value: 2, emoji: '😕', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '🙂', label: 'Bem' },
  { value: 5, emoji: '😄', label: 'Muito bem' },
];
