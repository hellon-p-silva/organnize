/** Acesso seguro ao localStorage (pode falhar em modo privado ou cota cheia). */
export function readLS(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLS(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeLS(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignora */
  }
}

/** Toda chave de dados do usuário leva este prefixo. */
export const userKey = (user: string, key: string) => `u:${user}::${key}`;
