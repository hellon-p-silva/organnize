import { useEffect, useRef, useState } from 'react';
import { BellRing, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { REST_PRESETS } from '../lib/workout-data';
import { fmtClock } from '../lib/dates';
import { ring, unlockAudio } from '../lib/alarm';
import { cx } from '../lib/utils';
import { Button, Card, IconButton } from './ui';

/** Cronômetro de descanso com alarme sonoro e vibração. Usa horário-alvo, então não atrasa em segundo plano. */
export function RestTimer() {
  const [duration, setDuration] = useState(90);
  const [remaining, setRemaining] = useState(90_000);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (endAt == null) return;
    const tick = () => {
      const left = endAt - Date.now();
      if (left <= 0) {
        setRemaining(0);
        setEndAt(null);
        setFinished(true);
        if (!firedRef.current) {
          firedRef.current = true;
          ring(4);
        }
      } else setRemaining(left);
    };
    tick();
    const t = window.setInterval(tick, 200);
    return () => window.clearInterval(t);
  }, [endAt]);

  const running = endAt != null;
  const start = () => {
    unlockAudio();
    firedRef.current = false;
    setFinished(false);
    const base = remaining > 0 ? remaining : duration * 1000;
    setEndAt(Date.now() + base);
  };
  const pause = () => {
    if (endAt) setRemaining(Math.max(0, endAt - Date.now()));
    setEndAt(null);
  };
  const reset = (secs = duration) => {
    setEndAt(null);
    setFinished(false);
    setDuration(secs);
    setRemaining(secs * 1000);
  };

  const pct = 1 - remaining / (duration * 1000);
  const R = 52;
  const C = 2 * Math.PI * R;

  return (
    <Card>
      <div className="mb-3 flex items-center gap-2">
        <Timer className="size-5 text-ember" />
        <h3 className="font-display font-semibold">Descanso</h3>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="relative size-32 shrink-0" aria-live="polite">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-surface-2)" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={finished ? 'var(--color-success)' : 'var(--color-ember)'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - Math.min(1, Math.max(0, pct)))}
              className="transition-[stroke-dashoffset] duration-200"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {finished ? (
              <>
                <BellRing className="size-6 text-success" />
                <span className="text-sm font-semibold text-success">Bora!</span>
              </>
            ) : (
              <span className="font-display text-3xl font-semibold tabular-nums">{fmtClock(remaining)}</span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tempo de descanso">
            {REST_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={duration === s}
                onClick={() => reset(s)}
                className={cx(
                  'min-h-11 min-w-12 rounded-xl px-3 text-sm font-semibold tabular-nums transition',
                  duration === s ? 'bg-ember/15 text-ember ring-1 ring-ember/50' : 'bg-surface-2 text-muted hover:text-ink',
                )}
              >
                {s < 60 ? `${s}s` : s % 60 ? `${Math.floor(s / 60)}m${s % 60}` : `${s / 60}min`}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {running ? (
              <Button variant="soft" className="h-12 flex-1" onClick={pause}>
                <Pause /> Pausar
              </Button>
            ) : (
              <Button variant="primary" className="h-12 flex-1" onClick={start}>
                <Play /> {remaining < duration * 1000 && remaining > 0 ? 'Continuar' : 'Iniciar'}
              </Button>
            )}
            <IconButton label="Zerar cronômetro" className="size-12 bg-surface-2" onClick={() => reset()}>
              <RotateCcw />
            </IconButton>
          </div>
        </div>
      </div>
    </Card>
  );
}
