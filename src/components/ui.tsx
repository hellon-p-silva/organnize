import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { Check as CheckIcon, X } from 'lucide-react';
import { clamp, cx, parseNum } from '../lib/utils';
import { COLOR_KEYS, COLOR_LABEL, colorVar, nextColor, type ColorKey } from '../lib/colors';

/* ───────── Card ───────── */
export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('glass rounded-2xl p-4 sm:p-5', className)} {...rest}>
      {children}
    </div>
  );
}

/* ───────── Botões ───────── */
type BtnVariant = 'primary' | 'soft' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-ember text-ember-ink font-semibold hover:bg-ember-2',
  soft: 'bg-surface-2 text-ink border border-line hover:border-muted/50',
  ghost: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'bg-danger text-bg font-semibold hover:opacity-90',
};

export function Button({
  variant = 'soft',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm transition [&_svg]:size-4 [&_svg]:shrink-0',
        'disabled:pointer-events-none disabled:opacity-40',
        BTN[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

type Tone = 'default' | 'danger' | 'ember';
const TONE: Record<Tone, string> = {
  default: 'text-muted hover:text-ink hover:bg-surface-2',
  danger: 'text-faint hover:text-danger hover:bg-danger/10',
  ember: 'text-ember hover:bg-ember/10',
};

export function IconButton({
  label,
  tone = 'default',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: Tone }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-xl transition [&_svg]:size-5',
        'disabled:pointer-events-none disabled:opacity-30',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ───────── Campos ───────── */
export function TextField({
  boxed,
  className,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { boxed?: boolean }) {
  return <input type="text" className={cx('field', boxed && 'field-box', className)} {...rest} />;
}

type NumberFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  decimals?: number;
  money?: boolean;
  boxed?: boolean;
  suffix?: string;
  inputClassName?: string;
};

/** Campo numérico em pt-BR (aceita vírgula). Edita como texto, salva como número. */
export function NumberField({
  value,
  onChange,
  decimals = 2,
  money,
  boxed,
  suffix,
  className,
  inputClassName,
  ...rest
}: NumberFieldProps) {
  const fmt = (v: number | null | undefined) =>
    v == null || !Number.isFinite(v)
      ? ''
      : v.toLocaleString('pt-BR', {
          minimumFractionDigits: money ? 2 : 0,
          maximumFractionDigits: money ? 2 : decimals,
          useGrouping: !!money,
        });
  const [draft, setDraft] = useState(() => fmt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  return (
    <div className={cx('relative flex items-center', className)}>
      {money && <span className="pointer-events-none absolute left-3 text-xs text-faint">R$</span>}
      <input
        type="text"
        inputMode={decimals === 0 ? 'numeric' : 'decimal'}
        autoComplete="off"
        className={cx('field tabular-nums', boxed && 'field-box', money && 'pl-9', suffix && 'pr-10', inputClassName)}
        value={draft}
        onFocus={(e) => {
          setFocused(true);
          e.currentTarget.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          setDraft(e.target.value);
          const n = parseNum(e.target.value);
          const f = 10 ** (money ? 2 : decimals);
          onChange(n == null ? null : Math.round(n * f) / f);
        }}
        {...rest}
      />
      {suffix && <span className="pointer-events-none absolute right-3 text-xs text-faint">{suffix}</span>}
    </div>
  );
}

/* ───────── Caixa de seleção (alvo de 44px) ───────── */
export function CheckBox({
  checked,
  onChange,
  label,
  color = 'ember',
  disabled,
  className,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  color?: ColorKey;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'group inline-flex size-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-30',
        className,
      )}
    >
      <span
        className={cx(
          'flex size-6 items-center justify-center rounded-lg border-2 transition',
          !checked && 'border-line group-hover:border-muted',
        )}
        style={checked ? { background: colorVar(color), borderColor: colorVar(color) } : undefined}
      >
        {checked && <CheckIcon className="size-4 text-ember-ink" strokeWidth={3} />}
      </span>
    </button>
  );
}

/* ───────── Progresso ───────── */
export function Progress({
  value,
  color = 'ember',
  label,
  className,
}: {
  value: number;
  color?: ColorKey | 'success';
  label?: string;
  className?: string;
}) {
  const pct = Math.round(clamp(Number.isFinite(value) ? value : 0, 0, 1) * 100);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={label}
      className={cx('h-2 w-full overflow-hidden rounded-full bg-surface-2', className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, var(--color-${color}), color-mix(in oklab, var(--color-${color}) 55%, var(--color-ember-2)))`,
        }}
      />
    </div>
  );
}

/* ───────── Cabeçalho de painel / estatística / vazio ───────── */
export function PanelHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-xl font-semibold sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  icon,
  label,
  value,
  hint,
  tone = 'ink',
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'ink' | 'success' | 'danger' | 'ember';
}) {
  const toneCls = { ink: 'text-ink', success: 'text-success', danger: 'text-danger', ember: 'text-ember' }[tone];
  return (
    <Card className="flex items-center gap-3 !p-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember [&_svg]:size-5">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
        <div className={cx('truncate font-display text-lg font-semibold tabular-nums sm:text-xl', toneCls)}>{value}</div>
        {hint && <div className="text-xs text-faint">{hint}</div>}
      </div>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-ember/10 text-ember [&_svg]:size-6">{icon}</div>
      <h3 className="font-display font-semibold">{title}</h3>
      {text && <p className="max-w-sm text-sm text-muted">{text}</p>}
      {action}
    </div>
  );
}

/* ───────── Cores ───────── */
export function ColorPicker({
  value,
  onChange,
  label = 'Cor',
}: {
  value: ColorKey;
  onChange: (c: ColorKey) => void;
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-0.5">
      {COLOR_KEYS.map((c) => (
        <button
          key={c}
          type="button"
          role="radio"
          aria-checked={value === c}
          aria-label={COLOR_LABEL[c]}
          title={COLOR_LABEL[c]}
          onClick={() => onChange(c)}
          className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-surface-2"
        >
          <span
            className={cx(
              'size-6 rounded-full ring-2 ring-offset-2 ring-offset-bg-soft transition',
              value === c ? 'ring-ink' : 'ring-transparent',
            )}
            style={{ background: colorVar(c) }}
          />
        </button>
      ))}
    </div>
  );
}

/** Botão compacto que alterna a cor a cada toque (para linhas de tabela). */
export function ColorCycle({ value, onChange, label }: { value: ColorKey; onChange: (c: ColorKey) => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={`${label}: ${COLOR_LABEL[value]}. Toque para trocar`}
      title={`Cor: ${COLOR_LABEL[value]} (toque para trocar)`}
      onClick={() => onChange(nextColor(value))}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl hover:bg-surface-2"
    >
      <span className="size-5 rounded-full" style={{ background: colorVar(value) }} />
    </button>
  );
}

/* ───────── Modal / folha que sobe de baixo no celular ───────── */
const modalStack: number[] = [];
let modalSeq = 0;
export const hasOpenModal = () => modalStack.length > 0;
const FOCUSABLE =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const id = ++modalSeq;
    modalStack.push(id);
    const prev = document.activeElement as HTMLElement | null;
    const isTop = () => modalStack[modalStack.length - 1] === id;

    const onKey = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab' && panel.current) {
        const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      const el =
        panel.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        panel.current?.querySelector<HTMLElement>(FOCUSABLE);
      el?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      const i = modalStack.indexOf(id);
      if (i >= 0) modalStack.splice(i, 1);
      document.body.style.overflow = prevOverflow;
      prev?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const width = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }[size];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-bg/70 backdrop-blur-sm"
        onClick={() => closeRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'relative max-h-[92dvh] w-full animate-sheet-up overflow-y-auto rounded-t-3xl border border-line bg-bg-soft p-5 shadow-2xl',
          'pb-[max(1.25rem,env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px))] sm:rounded-3xl',
          width,
        )}
      >
        <div className="mx-auto -mt-1 mb-3 h-1.5 w-10 rounded-full bg-line sm:hidden" aria-hidden="true" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="pt-2 font-display text-lg font-semibold">
            {title}
          </h2>
          <IconButton label="Fechar" onClick={() => closeRef.current()} className="-mr-2">
            <X />
          </IconButton>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  title,
  highlight,
  description,
  confirmLabel = 'Excluir',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  highlight?: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      {highlight && (
        <p className="break-words rounded-xl border border-line bg-surface-2 px-4 py-3 font-display text-base font-semibold text-ember">
          {highlight}
        </p>
      )}
      {description && <p className="mt-3 text-sm text-muted">{description}</p>}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button data-autofocus className="h-12" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} className="h-12" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

/* ───────── Abas internas (A/B/C, filtros) ───────── */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; color?: ColorKey }[];
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-bg/40 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cx(
              'min-h-11 rounded-xl px-4 text-sm font-semibold transition',
              active ? 'text-ember-ink' : 'text-muted hover:text-ink',
            )}
            style={active ? { background: colorVar(o.color ?? 'ember') } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1 block text-xs font-medium text-muted">{children}</span>;
}
