import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  BookOpen,
  CalendarDays,
  Dumbbell,
  HeartPulse,
  ListChecks,
  LogOut,
  RotateCcw,
  ShoppingCart,
  StickyNote,
  Target,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { LoginScreen } from './components/LoginScreen';
import { Logo } from './components/Logo';
import { InstallButton } from './components/InstallButton';
import { ConfirmDialog, IconButton } from './components/ui';
import { BudgetPanel } from './components/BudgetPanel';
import { RoutinePanel } from './components/RoutinePanel';
import { WorkoutPanel } from './components/WorkoutPanel';
import { ShoppingPanel } from './components/ShoppingPanel';
import { GoalsPanel } from './components/GoalsPanel';
import { HealthPanel } from './components/HealthPanel';
import { StudyPanel } from './components/StudyPanel';
import { AgendaPanel } from './components/AgendaPanel';
import { NotesPanel } from './components/NotesPanel';
import { clearSession, getSession, setSession } from './lib/auth';
import { UserContext, usePersistentState } from './hooks/use-persistent-state';
import { InstallContext, useInstallState } from './hooks/use-install';
import { useBudget } from './hooks/use-budget';
import { cx } from './lib/utils';

type TabId = 'budget' | 'routine' | 'workout' | 'shopping' | 'goals' | 'health' | 'study' | 'agenda' | 'notes';

const TABS: { id: TabId; label: string; title: string; icon: LucideIcon }[] = [
  { id: 'budget', label: 'Orçamento', title: 'Orçamento', icon: Wallet },
  { id: 'routine', label: 'Rotina', title: 'Rotina diária', icon: ListChecks },
  { id: 'workout', label: 'Treino', title: 'Treino ABC', icon: Dumbbell },
  { id: 'shopping', label: 'Compras', title: 'Compras', icon: ShoppingCart },
  { id: 'goals', label: 'Metas', title: 'Metas & Hábitos', icon: Target },
  { id: 'health', label: 'Saúde', title: 'Saúde', icon: HeartPulse },
  { id: 'study', label: 'Estudos', title: 'Estudos', icon: BookOpen },
  { id: 'agenda', label: 'Agenda', title: 'Agenda', icon: CalendarDays },
  { id: 'notes', label: 'Anotações', title: 'Anotações', icon: StickyNote },
];

export default function App() {
  const install = useInstallState();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  // Só lê o localStorage depois que o app abriu no navegador.
  useEffect(() => {
    setUser(getSession());
    setReady(true);
  }, []);

  return (
    <InstallContext.Provider value={install}>
      {!ready ? (
        <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
          <Logo className="size-14 animate-pulse" />
        </div>
      ) : !user ? (
        <LoginScreen
          onLogin={(u) => {
            setSession(u);
            setUser(u);
          }}
        />
      ) : (
        <UserContext.Provider value={user} key={user}>
          <Shell
            user={user}
            onLogout={() => {
              clearSession();
              setUser(null);
            }}
          />
        </UserContext.Provider>
      )}
    </InstallContext.Provider>
  );
}

function Shell({ user, onLogout }: { user: string; onLogout: () => void }) {
  const [tab, setTab] = usePersistentState<TabId>('ui:tab', 'budget');
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const budget = useBudget();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  useEffect(() => {
    document.title = `${active.title} · Organnize — sua vida organizada.`;
    tabRefs.current[active.id]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const i = TABS.findIndex((t) => t.id === active.id);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const panels: Record<TabId, ReactNode> = {
    budget: <BudgetPanel budget={budget} />,
    routine: <RoutinePanel />,
    workout: <WorkoutPanel />,
    shopping: <ShoppingPanel />,
    goals: <GoalsPanel />,
    health: <HealthPanel />,
    study: <StudyPanel />,
    agenda: <AgendaPanel />,
    notes: <NotesPanel />,
  };

  return (
    <div className="min-h-dvh pb-[calc(7rem+var(--safe-area-inset-bottom,0px))] sm:pb-10">
      <header className="sticky top-0 z-30 border-b border-line/60 bg-bg/80 pt-[max(env(safe-area-inset-top),var(--safe-area-inset-top,0px))] backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5">
          <Logo className="size-10 shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-lg font-bold leading-tight tracking-tight">Organnize</h1>
            <p className="truncate text-xs text-muted">
              olá, <span className="font-semibold text-ember">@{user}</span>
            </p>
          </div>
          {active.id === 'budget' && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              disabled={!budget.hasPaid}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-muted transition hover:bg-surface-2 hover:text-ink disabled:opacity-40"
              title="Desmarcar todos os pagamentos"
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">Resetar pagamentos</span>
              <span className="sm:hidden">Resetar</span>
            </button>
          )}
          <InstallButton variant="header" />
          <IconButton label="Sair" onClick={() => setConfirmLogout(true)}>
            <LogOut />
          </IconButton>
        </div>

        <nav className="mx-auto max-w-5xl">
          <div
            role="tablist"
            aria-label="Seções do Organnize"
            onKeyDown={onTabKey}
            className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const selected = t.id === active.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  className={cx(
                    'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition',
                    selected
                      ? 'bg-ember text-ember-ink shadow-[0_6px_20px_-8px_var(--color-ember)]'
                      : 'text-muted hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <Icon className="size-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {TABS.map((t) => (
          <section
            key={t.id}
            id={`panel-${t.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${t.id}`}
            hidden={t.id !== active.id}
            tabIndex={0}
            className="outline-none"
          >
            {panels[t.id]}
          </section>
        ))}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-4 text-center text-xs text-faint">
        Organnize · sua vida organizada. · dados salvos só neste aparelho
      </footer>

      <InstallButton variant="floating" />

      <ConfirmDialog
        open={confirmLogout}
        title="Sair da conta?"
        highlight={`@${user}`}
        description="Seus dados continuam salvos neste aparelho. Para voltar, entre com seu usuário e PIN."
        confirmLabel="Sair"
        tone="primary"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          onLogout();
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Resetar pagamentos?"
        description="Todas as caixas de pago (Jun–Dez) serão desmarcadas. Rendas e contas continuam como estão."
        confirmLabel="Resetar"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          budget.resetPaid();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}
