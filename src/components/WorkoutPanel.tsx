import { useRef, useState, type ChangeEvent } from 'react';
import { Dumbbell, Equal, ImageIcon, ImagePlus, Minus, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useWorkout } from '../hooks/use-workout';
import { defaultGuideSrc, type WorkoutId } from '../lib/workout-data';
import { colorVar } from '../lib/colors';
import { fmtNum } from '../lib/utils';
import { fmtShort, fromKey } from '../lib/dates';
import { RestTimer } from './RestTimer';
import {
  Button,
  Card,
  ColorPicker,
  EmptyState,
  IconButton,
  Modal,
  NumberField,
  PanelHeader,
  Segmented,
  TextField,
} from './ui';

async function fileToDataUrl(file: File, max = 1000): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * s);
    c.height = Math.round(img.height * s);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function WorkoutPanel() {
  const w = useWorkout();
  const [active, setActive] = useState<WorkoutId>('A');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const plan = w.workouts.find((x) => x.id === active) ?? w.workouts[0];

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Treino ABC"
        subtitle={`Anote o peso da semana (desde ${fmtShort(fromKey(w.thisWeek))}) e compare com a anterior.`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Escolher treino"
          value={active}
          onChange={setActive}
          options={w.workouts.map((x) => ({ value: x.id, label: `Treino ${x.id}`, color: x.color }))}
        />
        <Button onClick={() => setGuideOpen(true)}>
          <ImageIcon /> Guia
        </Button>
      </div>

      <Card className="space-y-4" style={{ borderColor: `color-mix(in oklab, ${colorVar(plan.color)} 45%, transparent)` }}>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-lg font-bold text-ember-ink"
            style={{ background: colorVar(plan.color) }}
            aria-hidden="true"
          >
            {plan.id}
          </span>
          <TextField
            aria-label="Nome do treino"
            value={plan.name}
            onChange={(e) => w.updateWorkout(plan.id, { name: e.target.value })}
            placeholder="Ex.: Peito e tríceps"
            className="min-w-40 flex-1 font-display text-lg font-semibold"
          />
          <ColorPicker label="Cor do treino" value={plan.color} onChange={(c) => w.updateWorkout(plan.id, { color: c })} />
        </div>

        {plan.exercises.length === 0 ? (
          <EmptyState
            icon={<Dumbbell />}
            title={`${plan.name || `Treino ${plan.id}`} sem exercícios`}
            text="Adicione os exercícios com séries e repetições. Toda semana, anote o peso usado."
            action={
              <Button variant="primary" onClick={() => setFocusId(w.addExercise(plan.id))}>
                <Plus /> Adicionar exercício
              </Button>
            }
          />
        ) : (
          <>
            <div className="scroll-x -mx-4 px-4 sm:-mx-5 sm:px-5">
              <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-faint">
                    <th scope="col" className="py-2 pl-3 font-medium">Exercício</th>
                    <th scope="col" className="w-20 py-2 pl-3 font-medium">Séries</th>
                    <th scope="col" className="w-24 py-2 pl-3 font-medium">Reps</th>
                    <th scope="col" className="w-28 py-2 pl-3 font-medium">Peso</th>
                    <th scope="col" className="w-36 py-2 pl-2 font-medium">vs. anterior</th>
                    <th scope="col" className="w-12"><span className="sr-only">Excluir</span></th>
                  </tr>
                </thead>
                <tbody>
                  {plan.exercises.map((ex) => {
                    const c = w.compare(ex.id);
                    return (
                      <tr key={ex.id}>
                        <td className="min-w-48 border-t border-line/60 py-1 pr-2">
                          <TextField
                            aria-label="Nome do exercício"
                            placeholder="Ex.: Supino reto"
                            value={ex.name}
                            autoFocus={focusId === ex.id}
                            onChange={(e) => w.updateExercise(plan.id, ex.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="border-t border-line/60 py-1 pr-2">
                          <NumberField
                            aria-label="Séries"
                            decimals={0}
                            value={ex.sets}
                            onChange={(v) => w.updateExercise(plan.id, ex.id, { sets: v })}
                          />
                        </td>
                        <td className="border-t border-line/60 py-1 pr-2">
                          <TextField
                            aria-label="Repetições"
                            placeholder="10-12"
                            value={ex.reps}
                            onChange={(e) => w.updateExercise(plan.id, ex.id, { reps: e.target.value })}
                          />
                        </td>
                        <td className="border-t border-line/60 py-1 pr-2">
                          <NumberField
                            aria-label={`Peso desta semana em ${ex.name || 'exercício'}`}
                            boxed
                            decimals={1}
                            suffix="kg"
                            placeholder="0"
                            value={c.current ?? null}
                            onChange={(v) => w.setWeight(ex.id, v)}
                          />
                        </td>
                        <td className="border-t border-line/60 py-1 pl-2">
                          <Trend current={c.current} prev={c.prev} />
                        </td>
                        <td className="border-t border-line/60 text-center">
                          <IconButton
                            label={`Excluir ${ex.name || 'exercício'}`}
                            tone="danger"
                            onClick={() => w.removeExercise(plan.id, ex.id)}
                          >
                            <Trash2 />
                          </IconButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Button onClick={() => setFocusId(w.addExercise(plan.id))}>
              <Plus /> Adicionar exercício
            </Button>
          </>
        )}
      </Card>

      <RestTimer />

      <GuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        id={plan.id}
        name={plan.name || `Treino ${plan.id}`}
        custom={w.guides[plan.id]}
        onPick={(url) => w.setGuide(plan.id, url)}
      />
    </div>
  );
}

function Trend({ current, prev }: { current?: number; prev?: number }) {
  if (current == null && prev == null) return <span className="text-faint">—</span>;
  if (current == null) return <span className="text-xs text-muted">ant.: {fmtNum(prev!)} kg</span>;
  if (prev == null) return <span className="text-xs text-muted">1º registro</span>;
  const d = Math.round((current - prev) * 10) / 10;
  if (d > 0)
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-success">
        <TrendingUp className="size-4" /> +{fmtNum(d)} kg <span className="sr-only">subiu</span>
      </span>
    );
  if (d < 0)
    return (
      <span className="inline-flex items-center gap-1 font-semibold text-danger">
        <TrendingDown className="size-4" /> {fmtNum(d)} kg <span className="sr-only">desceu</span>
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-muted">
      <Equal className="size-4" /> igual
    </span>
  );
}

function GuideModal({
  open,
  onClose,
  id,
  name,
  custom,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  id: WorkoutId;
  name: string;
  custom?: string;
  onPick: (url: string | null) => void;
}) {
  const [brokenFor, setBrokenFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const src = custom ?? defaultGuideSrc(id);
  const broken = brokenFor === src;

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setError(null);
      onPick(await fileToDataUrl(f));
    } catch {
      setError('Não consegui abrir essa imagem.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Guia · ${name}`} size="lg">
      {!broken ? (
        <img
          src={src}
          alt={`Guia ilustrativo do ${name}`}
          onError={() => setBrokenFor(src)}
          className="max-h-[65dvh] w-full rounded-2xl border border-line bg-bg object-contain"
        />
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-12 text-center">
          <ImageIcon className="size-8 text-faint" />
          <p className="text-sm text-muted">Nenhuma imagem para este treino ainda.</p>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <Button variant="primary" onClick={() => fileRef.current?.click()}>
          <ImagePlus /> {broken ? 'Escolher imagem' : 'Trocar imagem'}
        </Button>
        {custom && (
          <Button variant="ghost" onClick={() => onPick(null)}>
            <Minus /> Remover imagem
          </Button>
        )}
      </div>
    </Modal>
  );
}
