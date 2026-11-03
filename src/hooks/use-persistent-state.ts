import { createContext, useContext, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { readLS, userKey, writeLS } from '../lib/storage';

export const UserContext = createContext<string>('');
export const useUser = () => useContext(UserContext);

/**
 * Estado salvo no localStorage, isolado por usuário (prefixo "u:<usuario>::").
 * Regras de segurança dos dados:
 *  1. Só lê o localStorage depois que o app abriu no navegador (useEffect).
 *  2. Só grava depois de ter lido aquela chave — assim o valor padrão nunca
 *     sobrescreve dados existentes ao abrir/fechar o app.
 */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>, boolean] {
  const user = useUser();
  const fullKey = userKey(user, key);
  const [state, setState] = useState<T>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    const raw = readLS(fullKey);
    if (raw != null) {
      try {
        setState(JSON.parse(raw) as T);
      } catch {
        /* dado corrompido: mantém padrão, mas não sobrescreve até o usuário mudar algo */
      }
    }
    setLoadedKey(fullKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);

  useEffect(() => {
    if (loadedKey !== fullKey) return;
    writeLS(fullKey, JSON.stringify(state));
  }, [fullKey, loadedKey, state]);

  return [state, setState, loadedKey === fullKey];
}
