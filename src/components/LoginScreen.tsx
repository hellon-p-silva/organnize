import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui';
import { InstallButton } from './InstallButton';
import { hasUsers, login, register, PIN_RE, USERNAME_RE } from '../lib/auth';
import { cx } from '../lib/utils';

type Mode = 'login' | 'signup';

export function LoginScreen({ onLogin }: { onLogin: (user: string) => void }) {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hasUsers()) setMode('signup');
  }, []);

  const userOk = USERNAME_RE.test(username.trim());
  const pinOk = PIN_RE.test(pin);
  const canSubmit = userOk && pinOk && (mode === 'login' || pin === pin2) && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    const r = mode === 'login' ? await login(username, pin) : await register(username, pin);
    setBusy(false);
    if (r.ok) onLogin(r.user);
    else setError(r.error);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setPin('');
    setPin2('');
  };

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10 pb-28 sm:pb-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo className="size-16 drop-shadow-[0_10px_30px_color-mix(in_oklab,var(--color-ember)_45%,transparent)]" />
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight">Organnize</h1>
          <p className="mt-1 text-muted">sua vida organizada.</p>
        </div>

        <div className="glass rounded-3xl p-5">
          <div role="tablist" aria-label="Acesso" className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-bg/50 p-1">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={cx(
                  'min-h-11 rounded-xl text-sm font-semibold transition',
                  mode === m ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink',
                )}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Usuário</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint">@</span>
                <input
                  className="field field-box h-12 pl-8"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  maxLength={24}
                  placeholder="seunome"
                  aria-invalid={username.length > 0 && !userOk}
                  aria-describedby="user-hint"
                />
              </div>
              <span id="user-hint" className="mt-1 block text-xs text-faint">
                2–24 caracteres: letras, números, ponto, _ ou -
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">PIN</span>
              <div className="relative">
                <input
                  className="field field-box h-12 pr-12 tracking-[0.4em]"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="\d*"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  aria-describedby="pin-hint"
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute right-0.5 top-0.5 inline-flex size-11 items-center justify-center rounded-xl text-muted hover:text-ink"
                  aria-label={showPin ? 'Ocultar PIN' : 'Mostrar PIN'}
                >
                  {showPin ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              <span id="pin-hint" className="mt-1 block text-xs text-faint">
                De 4 a 6 dígitos
              </span>
            </label>

            {mode === 'signup' && (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Confirmar PIN</span>
                <input
                  className="field field-box h-12 tracking-[0.4em]"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  pattern="\d*"
                  autoComplete="new-password"
                  maxLength={6}
                  value={pin2}
                  onChange={(e) => setPin2(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  aria-invalid={pin2.length > 0 && pin2 !== pin}
                />
                {pin2.length > 0 && pin2 !== pin && (
                  <span className="mt-1 block text-xs text-danger">Os PINs não conferem.</span>
                )}
              </label>
            )}

            {error && (
              <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" className="h-12 w-full text-base" disabled={!canSubmit}>
              {busy ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
        </div>

        <p className="mt-5 flex items-start justify-center gap-2 text-center text-xs text-faint">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0" />
          Seus dados ficam só neste aparelho. Cada usuário tem os seus, separados.
        </p>
      </div>
      <InstallButton variant="floating" />
    </main>
  );
}
