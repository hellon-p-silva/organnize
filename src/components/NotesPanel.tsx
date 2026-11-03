import { useState } from 'react';
import { Pin, PinOff, Plus, Search, StickyNote, Trash2 } from 'lucide-react';
import { useNotes } from '../hooks/use-notes';
import { isEmptyNote } from '../lib/notes-data';
import { colorVar, tint } from '../lib/colors';
import { fmtDateTime } from '../lib/dates';
import { cx } from '../lib/utils';
import { Button, ColorPicker, ConfirmDialog, EmptyState, IconButton, Modal, PanelHeader } from './ui';

export function NotesPanel() {
  const [query, setQuery] = useState('');
  const n = useNotes(query);
  const [openId, setOpenId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const open = n.notes.find((x) => x.id === openId) ?? null;

  const close = () => {
    if (open && isEmptyNote(open)) n.remove(open.id);
    setOpenId(null);
  };

  const pinned = n.visible.filter((x) => x.pinned);
  const others = n.visible.filter((x) => !x.pinned);

  const grid = (list: typeof n.visible) => (
    <ul className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-3">
      {list.map((note) => (
        <li key={note.id}>
          <button
            type="button"
            onClick={() => {
              setIsNew(false);
              setOpenId(note.id);
            }}
            className="flex h-full min-h-32 w-full flex-col rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
            style={{ background: tint(note.color, 14), borderColor: `color-mix(in oklab, ${colorVar(note.color)} 35%, transparent)` }}
          >
            <div className="flex w-full items-start gap-2">
              <h4 className={cx('min-w-0 flex-1 break-words font-display font-semibold', !note.title && 'text-muted')}>
                {note.title || 'Sem título'}
              </h4>
              {note.pinned && <Pin className="size-4 shrink-0" style={{ color: colorVar(note.color) }} aria-label="Fixada" />}
            </div>
            {note.body && <p className="mt-1.5 line-clamp-5 whitespace-pre-wrap break-words text-sm text-muted">{note.body}</p>}
            <span className="mt-auto pt-3 text-[11px] text-faint">editada {fmtDateTime(note.updatedAt)}</span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Anotações"
        subtitle="Ideias, listas e lembretes. Fixe as importantes no topo."
        action={
          <Button variant="primary" onClick={() => {
              setIsNew(true);
              setOpenId(n.create());
            }}>
            <Plus /> Nova nota
          </Button>
        }
      />

      {n.notes.length > 0 && (
        <label className="relative block">
          <span className="sr-only">Buscar notas</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-faint" />
          <input
            type="search"
            className="field field-box h-12 pl-11"
            placeholder="Buscar nas notas…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      )}

      {n.notes.length === 0 ? (
        <EmptyState
          icon={<StickyNote />}
          title="Nenhuma anotação"
          text="Crie sua primeira nota. Escolha uma cor e fixe no topo se for importante."
          action={
            <Button variant="primary" onClick={() => {
              setIsNew(true);
              setOpenId(n.create());
            }}>
              <Plus /> Criar nota
            </Button>
          }
        />
      ) : n.visible.length === 0 ? (
        <p className="py-8 text-center text-muted">Nenhuma nota encontrada para “{query}”.</p>
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <section aria-label="Notas fixadas" className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                <Pin className="size-3.5" /> Fixadas
              </h3>
              {grid(pinned)}
            </section>
          )}
          {others.length > 0 && (
            <section aria-label="Outras notas" className="space-y-2">
              {pinned.length > 0 && <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Outras</h3>}
              {grid(others)}
            </section>
          )}
        </div>
      )}

      <Modal open={!!open} onClose={close} title={isNew ? 'Nova nota' : 'Editar nota'} size="lg">
        {open && (
          <div className="space-y-3">
            <input
              className="field field-box h-12 font-display text-lg font-semibold"
              placeholder="Título"
              aria-label="Título da nota"
              data-autofocus={isNew ? true : undefined}
              value={open.title}
              onChange={(e) => n.update(open.id, { title: e.target.value })}
            />
            <textarea
              className="field field-box min-h-56 resize-y"
              placeholder="Escreva sua nota…"
              aria-label="Texto da nota"
              value={open.body}
              onChange={(e) => n.update(open.id, { body: e.target.value })}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <ColorPicker label="Cor da nota" value={open.color} onChange={(c) => n.update(open.id, { color: c })} />
              <div className="flex gap-1">
                <IconButton
                  label={open.pinned ? 'Desafixar' : 'Fixar no topo'}
                  tone={open.pinned ? 'ember' : 'default'}
                  aria-pressed={open.pinned}
                  onClick={() => n.update(open.id, { pinned: !open.pinned })}
                >
                  {open.pinned ? <PinOff /> : <Pin />}
                </IconButton>
                <IconButton label="Excluir nota" tone="danger" onClick={() => setConfirmDelete(true)}>
                  <Trash2 />
                </IconButton>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-faint">Editada {fmtDateTime(open.updatedAt)} · salva automaticamente</span>
              <Button variant="primary" className="h-12 px-6" onClick={close}>
                Concluir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir nota?"
        highlight={open?.title || 'Nota sem título'}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (open) n.remove(open.id);
          setConfirmDelete(false);
          setOpenId(null);
        }}
      />
    </div>
  );
}
