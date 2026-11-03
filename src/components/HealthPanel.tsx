import { useState } from 'react';
import { ChevronLeft, ChevronRight, Droplet, Minus, Moon, Plus, Scale } from 'lucide-react';
import { useHealth } from '../hooks/use-health';
import { useToday } from '../hooks/use-today';
import { MOODS, WATER_GOAL } from '../lib/health-data';
import { addDays, cap, fromKey, toKey, WEEK_LETTERS_MON } from '../lib/dates';
import { cx, fmtNum } from '../lib/utils';
import type { ColorKey } from '../lib/colors';
import { Button, Card, IconButton, NumberField, PanelHeader, Progress } from './ui';

export function HealthPanel() {
  const h = useHealth();
  const today = useToday();
  const [day, setDay] = useState<string | null>(null);
  const current = day ?? today;
  const rec = h.get(current);
  const isToday = current === today;
  const shift = (n: number) => {
    const k = toKey(addDays(fromKey(current), n));
    setDay(k > today ? today : k);
  };

  return (
    <div className="space-y-5">
      <PanelHeader title="Saúde" subtitle="Registro do dia: água, sono, peso e humor." />

      <Card className="flex items-center justify-between gap-2 !py-2">
        <IconButton label="Dia anterior" onClick={() => shift(-1)}>
          <ChevronLeft />
        </IconButton>
        <div className="min-w-0 text-center">
          <div className="truncate font-display font-semibold">
            {cap(fromKey(current).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' }))}
          </div>
          {!isToday && (
            <button type="button" onClick={() => setDay(null)} className="min-h-8 text-xs font-semibold text-ember">
              Voltar para hoje
            </button>
          )}
          {isToday && <div className="text-xs text-muted">Hoje</div>}
        </div>
        <IconButton label="Próximo dia" onClick={() => shift(1)} disabled={isToday}>
          <ChevronRight />
        </IconButton>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Água */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <Droplet className="size-5 text-sky" /> Água
            </h3>
            <span className="text-sm tabular-nums text-muted">
              <b className="font-display text-xl text-ink">{rec.water}</b> / {WATER_GOAL} copos
            </span>
          </div>
          <div className="flex flex-wrap gap-1" aria-hidden="true">
            {Array.from({ length: Math.max(WATER_GOAL, rec.water) }, (_, i) => (
              <Droplet
                key={i}
                className={cx('size-7 transition', i < rec.water ? 'fill-sky text-sky' : 'text-line')}
              />
            ))}
          </div>
          <Progress value={rec.water / WATER_GOAL} color="sky" label="Meta de água" />
          <div className="flex gap-2">
            <Button className="h-12 w-16" aria-label="Menos um copo" onClick={() => h.update(current, { water: Math.max(0, rec.water - 1) })} disabled={rec.water === 0}>
              <Minus />
            </Button>
            <Button variant="primary" className="h-12 flex-1" onClick={() => h.update(current, { water: rec.water + 1 })}>
              <Plus /> 1 copo
            </Button>
          </div>
        </Card>

        {/* Humor */}
        <Card className="space-y-4">
          <h3 className="font-display font-semibold">Humor</h3>
          <div role="radiogroup" aria-label="Como você está?" className="grid grid-cols-5 gap-1.5">
            {MOODS.map((m) => {
              const on = rec.mood === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={m.label}
                  title={m.label}
                  onClick={() => h.update(current, { mood: on ? null : m.value })}
                  className={cx(
                    'flex min-h-16 flex-col items-center justify-center rounded-2xl border text-3xl transition',
                    on ? 'scale-105 border-ember bg-ember/15' : 'border-line bg-bg/30 opacity-70 grayscale-[40%] hover:opacity-100',
                  )}
                >
                  {m.emoji}
                </button>
              );
            })}
          </div>
          <p className="text-center text-sm text-muted">
            {rec.mood ? MOODS.find((m) => m.value === rec.mood)?.label : 'Toque para registrar como você está.'}
          </p>
        </Card>

        {/* Sono e peso */}
        <Card className="space-y-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 font-display font-semibold">
              <Moon className="size-5 text-violet" /> Horas de sono
            </span>
            <NumberField boxed decimals={1} suffix="h" placeholder="7,5" value={rec.sleep} onChange={(v) => h.update(current, { sleep: v == null ? null : Math.min(24, Math.max(0, v)) })} />
          </label>
          <MiniChart points={h.series(current, 'sleep')} unit="h" color="violet" label="Sono nos últimos 7 dias" />
        </Card>

        <Card className="space-y-3">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-2 font-display font-semibold">
              <Scale className="size-5 text-mint" /> Peso
            </span>
            <NumberField boxed decimals={1} suffix="kg" placeholder="70,0" value={rec.weight} onChange={(v) => h.update(current, { weight: v })} />
          </label>
          <MiniChart points={h.series(current, 'weight')} unit="kg" color="mint" label="Peso nos últimos 7 dias" />
        </Card>
      </div>
    </div>
  );
}

/** Mini-gráfico de linha em SVG puro (7 dias). */
function MiniChart({
  points,
  unit,
  color,
  label,
}: {
  points: { key: string; date: Date; value: number | null }[];
  unit: string;
  color: ColorKey;
  label: string;
}) {
  const W = 300;
  const H = 96;
  const padX = 14;
  const padTop = 16;
  const padBottom = 22;
  const vals = points.map((p) => p.value).filter((v): v is number => v != null);
  const has = vals.length > 0;
  const min = has ? Math.min(...vals) : 0;
  const max = has ? Math.max(...vals) : 1;
  const span = max - min || 1;
  const x = (i: number) => padX + (i * (W - padX * 2)) / (points.length - 1);
  const y = (v: number) => padTop + (1 - (v - min) / span) * (H - padTop - padBottom);
  const pts = points.map((p, i) => (p.value == null ? null : { i, x: x(i), y: y(p.value), v: p.value }));
  const line = pts.filter(Boolean) as { i: number; x: number; y: number; v: number }[];
  const d = line.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = line.length > 1 ? `${d} L${line[line.length - 1].x},${H - padBottom} L${line[0].x},${H - padBottom} Z` : '';
  const c = `var(--color-${color})`;
  const summary = has
    ? `${label}: mínimo ${fmtNum(min)} ${unit}, máximo ${fmtNum(max)} ${unit}, último ${fmtNum(line[line.length - 1].v)} ${unit}.`
    : `${label}: sem registros.`;

  return (
    <figure className="rounded-xl border border-line/60 bg-bg/30 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-24 w-full" role="img" aria-label={summary}>
        <line x1={padX} x2={W - padX} y1={H - padBottom} y2={H - padBottom} stroke="var(--color-line)" strokeWidth="1" />
        {area && <path d={area} fill={c} opacity="0.12" />}
        {d && <path d={d} fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {line.map((p) => (
          <g key={p.i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--color-bg)" stroke={c} strokeWidth="2" />
            <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="9" fill="var(--color-muted)">
              {fmtNum(p.v)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <text key={p.key} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-faint)">
            {WEEK_LETTERS_MON[(p.date.getDay() + 6) % 7]}
          </text>
        ))}
      </svg>
      <figcaption className="px-1 text-xs text-faint">{has ? `Últimos 7 dias · ${unit}` : 'Sem registros nos últimos 7 dias'}</figcaption>
    </figure>
  );
}
