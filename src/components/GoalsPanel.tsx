import { useState } from 'react';
import { Flame, Plus, Target, Trash2, Trophy } from 'lucide-react';
import { useGoals } from '../hooks/use-goals';
import { bestStreak, currentStreak } from '../lib/goals-data';
import { fromKey, toKey, WEEK_SHORT_MON, weekDays } from '../lib/dates';
import { cx } from '../lib/utils';
import { Button, Card, EmptyState, IconButton, NumberField, Progress, TextField } from './ui';

export function GoalsPanel() {
  const g = useGoals();
  const [focusId, setFocusId] = useState<string | null>(null);
  const days = weekDays(fromKey(g.today));

  return (
    <div className="space-y-8">
      {/* ───── Metas ───── */}
      <section className="space-y-4" aria-labelledby="goals-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="goals-title" className="font-display text-xl font-semibold sm:text-2xl">Metas</h2>
            <p className="text-sm text-muted">Objetivos com número: livros lidos, km corridos, reais guardados…</p>
          </div>
          <Button variant="primary" onClick={() => setFocusId(g.addGoal())}>
            <Plus /> Nova meta
          </Button>
        </div>

        {g.goals.length === 0 ? (
          <EmptyState icon={<Target />} title="Nenhuma meta ainda" text="Crie uma meta e use o +1 para avançar." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {g.goals.map((goal) => {
              const pct = goal.target > 0 ? goal.current / goal.target : 0;
              const done = pct >= 1;
              return (
                <Card key={goal.id} className={cx('space-y-3', done && 'border-success/50')}>
                  <div className="flex items-center gap-1">
                    <TextField
                      aria-label="Nome da meta"
                      placeholder="Ex.: Ler livros"
                      value={goal.name}
                      autoFocus={focusId === goal.id}
                      onChange={(e) => g.updateGoal(goal.id, { name: e.target.value })}
                      className="min-w-0 flex-1 font-display font-semibold"
                    />
                    <IconButton label={`Excluir meta ${goal.name}`} tone="danger" onClick={() => g.removeGoal(goal.id)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <label>
                      <span className="mb-1 block text-xs text-muted">Atual</span>
                      <NumberField boxed decimals={2} value={goal.current} onChange={(v) => g.updateGoal(goal.id, { current: Math.max(0, v ?? 0) })} />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-muted">Meta</span>
                      <NumberField boxed decimals={2} value={goal.target} onChange={(v) => g.updateGoal(goal.id, { target: Math.max(0, v ?? 0) })} />
                    </label>
                    <label>
                      <span className="mb-1 block text-xs text-muted">Unidade</span>
                      <TextField boxed placeholder="livros" value={goal.unit} onChange={(e) => g.updateGoal(goal.id, { unit: e.target.value })} />
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className={cx('font-semibold', done ? 'text-success' : 'text-ember')}>
                          {done ? 'Concluída 🎉' : `${Math.round(pct * 100)}%`}
                        </span>
                        <span className="tabular-nums text-muted">
                          {goal.current.toLocaleString('pt-BR')} / {goal.target.toLocaleString('pt-BR')} {goal.unit}
                        </span>
                      </div>
                      <Progress value={pct} color={done ? 'success' : 'ember'} label={`Progresso de ${goal.name || 'meta'}`} />
                    </div>
                    <Button variant="primary" className="h-12 min-w-16 text-base" onClick={() => g.increment(goal.id)} aria-label={`Somar 1 em ${goal.name || 'meta'}`}>
                      +1
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ───── Hábitos ───── */}
      <section className="space-y-4" aria-labelledby="habits-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="habits-title" className="font-display text-xl font-semibold sm:text-2xl">Hábitos</h2>
            <p className="text-sm text-muted">Marque os dias desta semana e mantenha a sequência acesa.</p>
          </div>
          <Button variant="primary" onClick={() => setFocusId(g.addHabit())}>
            <Plus /> Novo hábito
          </Button>
        </div>

        {g.habits.length === 0 ? (
          <EmptyState icon={<Flame />} title="Nenhum hábito ainda" text="Ex.: beber água, meditar, ler 10 páginas." />
        ) : (
          <div className="space-y-3">
            {g.habits.map((h) => {
              const cur = currentStreak(h.done, g.today);
              const best = bestStreak(h.done);
              const set = new Set(h.done);
              return (
                <Card key={h.id} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1">
                    <TextField
                      aria-label="Nome do hábito"
                      placeholder="Ex.: Meditar"
                      value={h.name}
                      autoFocus={focusId === h.id}
                      onChange={(e) => g.renameHabit(h.id, e.target.value)}
                      className="min-w-40 flex-1 font-display font-semibold"
                    />
                    <span className="inline-flex items-center gap-1 rounded-xl bg-ember/10 px-2.5 py-1.5 text-sm font-semibold text-ember" title="Sequência atual">
                      <span aria-hidden="true">🔥</span> {cur}
                      <span className="sr-only">dias seguidos</span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-surface-2 px-2.5 py-1.5 text-sm text-muted" title="Melhor sequência">
                      <Trophy className="size-3.5" /> {best}
                      <span className="sr-only">melhor sequência</span>
                    </span>
                    <IconButton label={`Excluir hábito ${h.name}`} tone="danger" onClick={() => g.removeHabit(h.id)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {days.map((d, i) => {
                      const k = toKey(d);
                      const isFuture = k > g.today;
                      const on = set.has(k);
                      return (
                        <button
                          key={k}
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          disabled={isFuture}
                          aria-label={`${h.name || 'Hábito'} em ${d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}`}
                          onClick={() => g.toggleDay(h.id, k)}
                          className={cx(
                            'flex min-h-14 flex-col items-center justify-center rounded-xl border text-xs font-semibold transition disabled:opacity-30',
                            on ? 'border-ember bg-ember text-ember-ink' : 'border-line bg-bg/30 text-muted hover:border-muted',
                            k === g.today && !on && 'border-ember/70 text-ink',
                          )}
                        >
                          <span>{WEEK_SHORT_MON[i]}</span>
                          <span className="text-[11px] font-medium opacity-80">{on ? '✓' : d.getDate()}</span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

