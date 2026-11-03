import type { ColorKey } from './colors';

export type Note = {
  id: string;
  title: string;
  body: string;
  color: ColorKey;
  pinned: boolean;
  updatedAt: number;
};

export const isEmptyNote = (n: Note) => !n.title.trim() && !n.body.trim();

export const sortNotes = (a: Note, b: Note) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt;
