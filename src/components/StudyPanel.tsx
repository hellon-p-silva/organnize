import { useEffect, useRef, useState } from 'react';
import { BookOpen, CircleCheck, Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useStudy } from '../hooks/use-study';
import { fmtMinutes, POMODORO, type PomodoroMode } from '../lib/study-data';
import { colorVar, type ColorKey } from '../lib/colors';
import { fmtClock } from '../lib/dates';
import { ring, unlockAudio } from '../lib/alarm';
import { cx } from '../lib/utils';
import {
  Button,
  Card,
  ColorCycle,
  ConfirmDialog,
  EmptyState,
  IconButton,
  NumberField,
  PanelHeader,
  Progress,
  Segmented,
  TextField,
} from './ui';

export function StudyPanel() {
  const st = useStudy();
  const [focusId, setFocusId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="space-y-5">
      <PanelHeader title="Estudos" subtitle="Pomodoro ligado à matéria e meta semanal em minutos." />

      <Pomodoro subjects={st.subjects} onFocusDone={st.logSession} todayCount={st.todaySessions.length} />

      <Card className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display font-semibold">Matérias</h3>
            <p className="text-xs text-muted">Esta semana: {fmtMinutes(st.weekTotal)} estudados</p>
          </div>
          <Button variant="primary" onClick={() => setFocusId(st.addSubject())}>
            <Plus /> Nova matéria
          </Button>
        </div>

        {st.subjects.length === 0 ? (
          <EmptyState icon={<BookOpen />} title="Nenhuma matéria" text="Cadastre as matérias com uma meta semanal para acompanhar seu tempo de estudo." />
        ) : (
          <ul className="space-y-3">
            {st.subjects.map((s) => {
              const done = st.weekMinutes[s.id] ?? 0;
              const pct = s.weeklyGoal > 0 ? done / s.weeklyGoal : 0;
              return (
                <li key={s.id} className="rounded-xl border border-line/60 bg-bg/30 p-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <ColorCycle label="Cor da matéria" value={s.color} onChange={(c) => st.updateSubject(s.id, { color: c })} />
                    <TextField
                      aria-label="Nome da matéria"
                      placeholder="Ex.: Matemática"
                      value={s.name}
                      autoFocus={focusId === s.id}
                      onChange={(e) => st.updateSubject(s.id, { name: e.target.value })}
                      className="min-w-36 flex-1 font-semibold"
                    />
                    <label className="flex items-center gap-1 text-xs text-muted">
                      <span className="whitespace-nowrap">Meta/sem.</span>
                      <NumberField
                        aria-label="Meta semanal em minutos"
                        boxed
                        decimals={0}
                        suffix="min"
                        className="w-28"
                        value={s.weeklyGoal}
                        onChange={(v) => st.updateSubject(s.id, { weeklyGoal: Math.max(0, v ?? 0) })}
                      />
                    </label>
                    <IconButton label={`Excluir ${s.name || 'matéria'}`} tone="danger" onClick={() => setToDelete({ id: s.id, name: s.name || 'Matéria sem nome' })}>
                      <Trash2 />
                    </IconButton>
                  </div>
                  <div className="mt-1 flex items-center gap-3 px-2 pb-1">
                    <Progress value={pct} color={s.color} label={`${s.name}: ${done} de ${s.weeklyGoal} minutos`} />
                    <span className={cx('shrink-0 text-xs tabular-nums', pct >= 1 ? 'font-semibold text-success' : 'text-muted')}>
                      {done} / {s.weeklyGoal} min
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-display font-semibold">Histórico de hoje</h3>
          <span className="text-sm text-muted">{fmtMinutes(st.todayTotal)}</span>
        </div>
        {st.todaySessions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Nenhuma sessão hoje. Comece um Pomodoro!</p>
        ) : (
          <ul className="divide-y divide-line/50">
            {st.todaySessions.map((x) => {
              const subj = st.subjects.find((s) => s.id === x.subjectId);
              return (
                <li key={x.id} className="flex items-center gap-3 py-1">
                  <span className="size-3 shrink-0 rounded-full" style={{ background: subj ? colorVar(subj.color) : 'var(--color-faint)' }} />
                  <span className="min-w-0 flex-1 truncate">{subj?.name || 'Matéria'}</span>
                  <span className="text-sm tabular-nums text-muted">
                    {new Date(x.at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="w-16 text-right text-sm font-semibold tabular-nums">{x.minutes} min</span>
                  <IconButton label="Excluir sessão" tone="danger" onClick={() => st.removeSession(x.id)}>
                    <Trash2 />
                  </IconButton>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir matéria?"
        highlight={toDelete?.name}
        description="As sessões registradas dessa matéria também serão apagadas."
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) st.removeSubject(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}

function Pomodoro({
  subjects,
  onFocusDone,
  todayCount,
}: {
  subjects: { id: string; name: string; color: ColorKey }[];
  onFocusDone: (subjectId: string, minutes: number) => void;
  todayCount: number;
}) {
  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [subjectId, setSubjectId] = useState<string>('');
  const [remaining, setRemaining] = useState(POMODORO.focus.minutes * 60_000);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [cycles, setCycles] = useState(0);
  const doneRef = useRef(false);
  const total = POMODORO[mode].minutes * 60_000;
  const subj = subjects.find((s) => s.id === subjectId);

  // Escolhe a primeira matéria automaticamente / corrige se a matéria foi excluída.
  useEffect(() => {
    if (!subjects.some((s) => s.id === subjectId)) setSubjectId(subjects[0]?.id ?? '');
  }, [subjects, subjectId]);

  const switchMode = (m: PomodoroMode) => {
    setMode(m);
    setEndAt(null);
    setRemaining(POMODORO[m].minutes * 60_000);
  };

  const finishFocus = (minutes: number) => {
    if (subjectId && minutes > 0) onFocusDone(subjectId, minutes);
    const n = cycles + 1;
    setCycles(n);
    switchMode(n % 4 === 0 ? 'long' : 'short');
  };

  useEffect(() => {
    if (endAt == null) return;
    const tick = () => {
      const left = endAt - Date.now();
      if (left > 0) return setRemaining(left);
      if (doneRef.current) return;
      doneRef.current = true;
      ring(4);
      if (mode === 'focus') finishFocus(POMODORO.focus.minutes);
      else switchMode('focus');
    };
    tick();
    const t = window.setInterval(tick, 250);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endAt, mode]);

  const running = endAt != null;
  const start = () => {
    unlockAudio();
    doneRef.current = false;
    setEndAt(Date.now() + (remaining > 0 ? remaining : total));
  };
  const pause = () => {
    if (endAt) setRemaining(Math.max(0, endAt - Date.now()));
    setEndAt(null);
  };
  const elapsedMin = Math.floor((total - remaining) / 60_000);
  const color = mode === 'focus' ? (subj?.color ?? 'ember') : 'mint';
  const pct = 1 - remaining / total;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented<PomodoroMode>
          label="Modo do Pomodoro"
          value={mode}
          onChange={switchMode}
          options={(Object.keys(POMODORO) as PomodoroMode[]).map((m) => ({
            value: m,
            label: `${m === 'focus' ? 'Foco' : m === 'short' ? 'Pausa' : 'Longa'} ${POMODORO[m].minutes}`,
            color: m === 'focus' ? 'ember' : 'mint',
          }))}
        />
        <span className="text-sm text-muted">
          🍅 {todayCount} {todayCount === 1 ? 'sessão' : 'sessões'} hoje
        </span>
      </div>

      <div className="text-center">
        <div className="text-sm font-semibold uppercase tracking-widest" style={{ color: colorVar(color) }}>
          {POMODORO[mode].label}
          {mode === 'focus' && subj?.name ? ` · ${subj.name}` : ''}
        </div>
        <div className="my-2 font-display text-6xl font-semibold tabular-nums sm:text-7xl" aria-live="off">
          {fmtClock(remaining)}
        </div>
        <Progress value={pct} color={color} label="Tempo decorrido" className="mx-auto max-w-sm" />
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted">Matéria</span>
        <select
          className="field field-box"
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          disabled={subjects.length === 0}
        >
          {subjects.length === 0 && <option value="">Cadastre uma matéria abaixo</option>}
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || 'Matéria sem nome'}
            </option>
          ))}
        </select>
      </label>

      <div className="flex gap-2">
        {running ? (
          <Button className="h-12 flex-1" onClick={pause}>
            <Pause /> Pausar
          </Button>
        ) : (
          <Button variant="primary" className="h-12 flex-1" onClick={start} disabled={mode === 'focus' && !subjectId}>
            <Play /> {remaining < total ? 'Continuar' : 'Iniciar'}
          </Button>
        )}
        {mode === 'focus' && elapsedMin >= 1 && (
          <Button
            className="h-12"
            onClick={() => {
              setEndAt(null);
              finishFocus(elapsedMin);
            }}
            title="Encerrar e salvar os minutos feitos"
          >
            <CircleCheck /> Salvar {elapsedMin} min
          </Button>
        )}
        <IconButton label="Reiniciar" className="size-12 bg-surface-2" onClick={() => switchMode(mode)}>
          <RotateCcw />
        </IconButton>
      </div>
    </Card>
  );
}
