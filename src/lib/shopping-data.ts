export type ShopItem = {
  id: string;
  name: string;
  category: string;
  qty: number | null;
  unit: string;
  /** Preço Real: valor FIXO do item (não é multiplicado pela quantidade). */
  price: number | null;
  bought: boolean;
};

export const CATEGORIES = [
  'Hortifrúti',
  'Mercearia',
  'Carnes',
  'Frios e laticínios',
  'Padaria',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Pet',
  'Outros',
];

export const UNITS = ['un', 'kg', 'g', 'L', 'ml', 'pct', 'cx', 'dz'];

export type ShopFilter = 'all' | 'pending' | 'bought';
