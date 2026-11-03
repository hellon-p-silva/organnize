export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export const sum = (arr: number[]) => arr.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const fmtBRL = (n: number | null | undefined) => brl.format(Number.isFinite(n as number) ? (n as number) : 0);

export const fmtNum = (n: number, max = 1) => n.toLocaleString('pt-BR', { maximumFractionDigits: max });

/** Converte texto digitado em pt-BR ("1.234,56", "72,5", "72.5") em número. */
export function parseNum(input: string): number | null {
  let t = input.trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!t || t === '-' || t === ',' || t === '.') return null;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
    // "1.500" → 1500 (separador de milhar)
    t = t.replace(/\./g, '');
  }
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
}

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
