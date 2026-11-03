import { useState } from 'react';
import { Eraser, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useRoutine } from '../hooks/use-routine';
import { cap, fmtLong, fromKey } from '../lib/dates';
import { cx } from '../lib/utils';
import { Button, Card, CheckBox, EmptyState, IconButton, PanelHeader, Progress, TextField } from './ui';

export function RoutinePanel() {
  const r = useRoutine();
  const [focusId, setFocusId] = useState<string | null>(null);
  const pct = Math.round(r.progress.pct * 100);

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Rotina diária"
        subtitle="Suas atividades do dia. As marcações recomeçam todo dia."
        action={
          <Button variant="primary" onClick={() => setFocusId(r.add())}>
            <Plus /> Nova atividade
          </Button>
        }
      />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-muted">Hoje</div>
            <div className="font-display text-lg font-semibold">{cap(fmtLong(fromKey(r.today)))}</div>
          </div>
          <div className="text-right">
            <div className={cx('font-display text-2xl font-semibold tabular-nums', pct === 100 && 'text-success')}>{pct}%</div>
            <div className="text-xs text-muted">
              {r.progress.done} de {r.progress.total} feitas
            </div>
          </div>
        </div>
        <Progress className="mt-3" value={r.progress.pct} color={pct === 100 ? 'success' : 'ember'} label="Progresso do dia" />
        {r.progress.done > 0 && (
          <Button variant="ghost" className="mt-3 -ml-2" onClick={r.clearToday}>
            <Eraser /> Desmarcar hoje
          </Button>
        )}
      </Card>

      {r.items.length === 0 ? (
        <EmptyState
          icon={<ListChecks />}
          title="Sua rotina está vazia"
          text="Adicione atividades com horário — acordar, treino, trabalho, leitura — e marque conforme for fazendo."
          action={
            <Button variant="primary" onClick={() => setFocusId(r.add())}>
              <Plus /> Adicionar atividade
            </Button>
          }
        />
      ) : (
        <Card className="!px-0 !py-2">
          <div className="scroll-x px-2">
            <div className="min-w-[440px]" role="list">
              <div className="grid grid-cols-[48px_130px_1fr_48px] items-center gap-1 px-1 py-2 text-xs font-medium uppercase tracking-wide text-faint">
                <span className="sr-only">Feito</span>
                <span className="pl-3">Horário</span>
                <span className="pl-3">Atividade</span>
                <span className="sr-only">Excluir</span>
              </div>
              {r.items.map((it) => {
                const done = r.isDone(it.id);
                return (
                  <div
                    key={it.id}
                    role="listitem"
                    className="grid grid-cols-[48px_130px_1fr_48px] items-center gap-1 border-t border-line/50 px-1 py-1"
                  >
                    <CheckBox checked={done} onChange={() => r.toggle(it.id)} label={`Concluir ${it.name || 'atividade'}`} />
                    <input
                      type="time"
                      aria-label="Horário"
                      className="field tabular-nums"
                      value={it.time}
                      onChange={(e) => r.update(it.id, { time: e.target.value })}
                    />
                    <TextField
                      aria-label="Atividade"
                      placeholder="Ex.: Caminhada"
                      value={it.name}
                      autoFocus={focusId === it.id}
                      onChange={(e) => r.update(it.id, { name: e.target.value })}
                      className={cx(done && 'text-muted line-through')}
                    />
                    <IconButton label={`Excluir ${it.name || 'atividade'}`} tone="danger" onClick={() => r.remove(it.id)}>
                      <Trash2 />
                    </IconButton>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
