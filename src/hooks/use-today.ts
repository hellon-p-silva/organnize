import { useEffect, useState } from 'react';
import { todayKey } from '../lib/dates';

/** Data de hoje (AAAA-MM-DD) que se atualiza sozinha na virada do dia. */
export function useToday() {
  const [key, setKey] = useState(todayKey);
  useEffect(() => {
    const update = () => setKey(todayKey());
    const t = window.setInterval(update, 30_000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return key;
}
