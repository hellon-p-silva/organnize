import { useState, type FormEvent } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAgenda } from '../hooks/use-agenda';
import { useToday } from '../hooks/use-today';
import { monthGrid, type AgendaEvent } from '../lib/agenda-data';
import { colorVar, tint, type ColorKey } from '../lib/colors';
import { cap, fmtLong, fromKey, MONTH_NAMES, WEEK_SHORT_SUN } from '../lib/dates';
import { cx } from '../lib/utils';
import { Button, Card, ColorPicker, ConfirmDialog, EmptyState, FieldLabel, IconButton, Modal, PanelHeader, TextField } from './ui';

type Draft = { id?: string; date: string; time: string; title: string; notes: string; color: ColorKey };

export function AgendaPanel() {
  const a = useAgenda();
  const today = useToday();
  const t = fromKey(today);
  const [view, setView] = useState({ y: t.getFullYear(), m: t.getMonth() });
  const [selected, setSelected] = useState(today);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<AgendaEvent | null>(null);

  const cells = monthGrid(view.y, view.m);
  const dayEvents = a.byDay[selected] ?? [];

  const move = (n: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  const goToday = () => {
    setView({ y: t.getFullYear(), m: t.getMonth() });
    setSelected(today);
  };
  const pick = (key: string) => {
    setSelected(key);
    const d = fromKey(key);
    if (d.getMonth() !== view.m || d.getFullYear() !== view.y) setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const newEvent = () => setDraft({ date: selected, time: '', title: '', notes: '', color: 'ember' });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft || !draft.title.trim()) return;
    a.save({ ...draft, title: draft.title.trim(), notes: draft.notes.trim() });
    if (draft.date !== selected) pick(draft.date);
    setDraft(null);
  };

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Agenda"
        subtitle="Toque num dia para ver e criar compromissos."
        action={
          <Button variant="primary" onClick={newEvent}>
            <Plus /> Novo evento
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="!p-3 sm:!p-4">
          <div className="mb-3 flex items-center gap-1">
            <IconButton label="Mês anterior" onClick={() => move(-1)}>
              <ChevronLeft />
            </IconButton>
            <h3 className="flex-1 text-center font-display text-lg font-semibold" aria-live="polite">
              {cap(MONTH_NAMES[view.m])} <span className="text-muted">{view.y}</span>
            </h3>
            <IconButton label="Próximo mês" onClick={() => move(1)}>
              <ChevronRight />
            </IconButton>
            <Button variant="soft" className="ml-1 px-3" onClick={goToday}>
              Hoje
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1" role="grid" aria-label={`Calendário de ${MONTH_NAMES[view.m]} de ${view.y}`}>
            {WEEK_SHORT_SUN.map((w) => (
              <div key={w} role="columnheader" className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-faint">
                {w}
              </div>
            ))}
            {cells.map((c) => {
              const evs = a.byDay[c.key] ?? [];
              const isSel = c.key === selected;
              const isToday = c.key === today;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="gridcell"
                  aria-selected={isSel}
                  aria-label={`${c.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}${evs.length ? `, ${evs.length} ${evs.length === 1 ? 'evento' : 'eventos'}` : ''}`}
                  onClick={() => pick(c.key)}
                  className={cx(
                    'flex aspect-square min-h-11 flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold tabular-nums transition',
                    isSel ? 'bg-ember text-ember-ink' : 'hover:bg-surface-2',
                    !isSel && !c.inMonth && 'text-faint/60',
                    !isSel && isToday && 'ring-2 ring-inset ring-ember text-ember',
                  )}
                >
                  {c.date.getDate()}
                  <span className="flex h-1.5 gap-0.5" aria-hidden="true">
                    {evs.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="size-1.5 rounded-full"
                        style={{ background: isSel ? 'var(--color-ember-ink)' : colorVar(e.color) }}
                      />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-muted">{selected === today ? 'Hoje' : 'Dia escolhido'}</div>
              <h3 className="font-display font-semibold">{cap(fmtLong(fromKey(selected)))}</h3>
            </div>
            <IconButton label="Novo evento neste dia" tone="ember" onClick={newEvent}>
              <Plus />
            </IconButton>
          </div>

          {dayEvents.length === 0 ? (
            <EmptyState icon={<CalendarDays />} title="Dia livre" text="Nenhum evento neste dia." />
          ) : (
            <ul className="space-y-2">
              {dayEvents.map((e) => (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-xl border-l-4 p-3"
                  style={{ borderLeftColor: colorVar(e.color), background: tint(e.color, 12) }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                      <Clock className="size-3.5" /> {e.time || 'Dia todo'}
                    </div>
                    <div className="mt-0.5 break-words font-semibold">{e.title}</div>
                    {e.notes && <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted">{e.notes}</p>}
                  </div>
                  <IconButton label={`Editar ${e.title}`} onClick={() => setDraft({ ...e })}>
                    <Pencil />
                  </IconButton>
                  <IconButton label={`Excluir ${e.title}`} tone="danger" onClick={() => setToDelete(e)}>
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Editar evento' : 'Novo evento'}>
        {draft && (
          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <FieldLabel>Título</FieldLabel>
              <TextField
                boxed
                data-autofocus
                required
                placeholder="Ex.: Dentista"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <FieldLabel>Data</FieldLabel>
                <input type="date" className="field field-box" value={draft.date} required onChange={(e) => e.target.value && setDraft({ ...draft, date: e.target.value })} />
              </label>
              <label className="block">
                <FieldLabel>Horário</FieldLabel>
                <input type="time" className="field field-box" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
              </label>
            </div>
            <label className="block">
              <FieldLabel>Notas</FieldLabel>
              <textarea
                className="field field-box min-h-24 resize-y"
                placeholder="Endereço, o que levar…"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </label>
            <div>
              <FieldLabel>Cor</FieldLabel>
              <ColorPicker label="Cor do evento" value={draft.color} onChange={(c) => setDraft({ ...draft, color: c })} />
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button className="h-12" onClick={() => setDraft(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="h-12" disabled={!draft.title.trim()}>
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir evento?"
        highlight={toDelete?.title}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) a.remove(toDelete.id);
          setToDelete(null);
        }}
      />
    </div>
  );
}
