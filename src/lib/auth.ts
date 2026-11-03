import { readLS, writeLS, removeLS } from './storage';

const USERS_KEY = 'organnize:users';
const SESSION_KEY = 'organnize:session';

export const USERNAME_RE = /^[a-zA-Z0-9._-]{2,24}$/;
export const PIN_RE = /^\d{4,6}$/;

type UserRecord = { hash: string; createdAt: number };
type UsersDB = Record<string, UserRecord>;

export const normalizeUser = (u: string) => u.trim().toLowerCase();

function readUsers(): UsersDB {
  try {
    const raw = readLS(USERS_KEY);
    return raw ? (JSON.parse(raw) as UsersDB) : {};
  } catch {
    return {};
  }
}

/** SHA-256 em hex. Usa crypto.subtle; fallback puro em JS para contextos sem HTTPS (ex.: teste na rede local). */
export async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(text);
}

function sha256Fallback(text: string): string {
  const data = new TextEncoder().encode(text);
  const primes: number[] = [];
  for (let n = 2; primes.length < 64; n++) if (primes.every((p) => n % p !== 0)) primes.push(n);
  const frac = (x: number) => ((x - Math.floor(x)) * 0x100000000) >>> 0;
  const H = primes.slice(0, 8).map((p) => frac(Math.sqrt(p)));
  const K = primes.map((p) => frac(Math.cbrt(p)));
  const len = data.length;
  const total = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(total);
  buf.set(data);
  buf[len] = 0x80;
  const dv = new DataView(buf.buffer);
  const bits = len * 8;
  dv.setUint32(total - 4, bits >>> 0);
  dv.setUint32(total - 8, Math.floor(bits / 0x100000000));
  const W = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let o = 0; o < total; o += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) {
      const a = W[i - 15], b = W[i - 2];
      const s0 = rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3);
      const s1 = rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const mj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + mj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}

const hashPin = (user: string, pin: string) => sha256Hex(`${user}::${pin}`);

type Result = { ok: true; user: string } | { ok: false; error: string };

function validate(username: string, pin: string): string | null {
  if (!USERNAME_RE.test(username.trim())) return 'Usuário deve ter 2 a 24 caracteres: letras, números, ponto, _ ou -.';
  if (!PIN_RE.test(pin)) return 'O PIN deve ter de 4 a 6 dígitos.';
  return null;
}

export async function register(username: string, pin: string): Promise<Result> {
  const err = validate(username, pin);
  if (err) return { ok: false, error: err };
  const user = normalizeUser(username);
  const users = readUsers();
  if (users[user]) return { ok: false, error: 'Esse usuário já existe neste aparelho. Use "Entrar".' };
  users[user] = { hash: await hashPin(user, pin), createdAt: Date.now() };
  if (!writeLS(USERS_KEY, JSON.stringify(users))) return { ok: false, error: 'Não foi possível salvar no aparelho.' };
  return { ok: true, user };
}

export async function login(username: string, pin: string): Promise<Result> {
  const err = validate(username, pin);
  if (err) return { ok: false, error: err };
  const user = normalizeUser(username);
  const rec = readUsers()[user];
  if (!rec) return { ok: false, error: 'Usuário não encontrado neste aparelho. Crie uma conta.' };
  if ((await hashPin(user, pin)) !== rec.hash) return { ok: false, error: 'PIN incorreto.' };
  return { ok: true, user };
}

export const hasUsers = () => Object.keys(readUsers()).length > 0;
export const getSession = () => {
  const u = readLS(SESSION_KEY);
  return u && readUsers()[u] ? u : null;
};
export const setSession = (u: string) => writeLS(SESSION_KEY, u);
export const clearSession = () => removeLS(SESSION_KEY);
