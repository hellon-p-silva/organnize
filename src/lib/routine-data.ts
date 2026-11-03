export type RoutineItem = { id: string; time: string; name: string };

/** Atividades concluídas por dia: "AAAA-MM-DD" → ids. */
export type RoutineChecks = Record<string, string[]>;

/** Ordena por horário; itens sem horário vão para o fim. */
export const sortByTime = (items: RoutineItem[]) =>
  [...items].sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
