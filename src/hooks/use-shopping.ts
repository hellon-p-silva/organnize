import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import type { ShopItem } from '../lib/shopping-data';
import { sum, uid } from '../lib/utils';

export function useShopping() {
  const [items, setItems] = usePersistentState<ShopItem[]>('shopping:items', []);

  /** Calculado em tempo real. Preço Real é fixo por item — nunca multiplicado pela quantidade. */
  const stats = useMemo(() => {
    const bought = items.filter((i) => i.bought);
    const total = sum(items.map((i) => i.price ?? 0));
    const boughtTotal = sum(bought.map((i) => i.price ?? 0));
    return { count: items.length, boughtCount: bought.length, total, boughtTotal, remaining: total - boughtTotal };
  }, [items]);

  const add = useCallback(() => {
    const id = uid();
    setItems((xs) => [...xs, { id, name: '', category: '', qty: 1, unit: 'un', price: null, bought: false }]);
    return id;
  }, [setItems]);

  const update = useCallback(
    (id: string, patch: Partial<Omit<ShopItem, 'id'>>) =>
      setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x))),
    [setItems],
  );

  const remove = useCallback((id: string) => setItems((xs) => xs.filter((x) => x.id !== id)), [setItems]);
  const clearBought = useCallback(() => setItems((xs) => xs.filter((x) => !x.bought)), [setItems]);
  const uncheckAll = useCallback(() => setItems((xs) => xs.map((x) => ({ ...x, bought: false }))), [setItems]);

  return { items, stats, add, update, remove, clearBought, uncheckAll };
}
