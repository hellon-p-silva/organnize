import { useState } from 'react';
import { CalendarClock, PiggyBank, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import type { Budget } from '../hooks/use-budget';
import { MONTHS } from '../lib/budget-data';
import { clamp, cx, fmtBRL, sum } from '../lib/utils';
import {
  Button,
  Card,
  CheckBox,
  ConfirmDialog,
  EmptyState,
  FieldLabel,
  IconButton,
  NumberField,
  PanelHeader,
  Progress,
  Stat,
  TextField,
} from './ui';

export function BudgetPanel({ budget }: { budget: Budget }) {
  const { periods, totals, monthStats } = budget;
  const [billToDelete, setBillToDelete] = useState<{ pid: string; bid: string; name: string } | null>(null);
  const [periodToDelete, setPeriodToDelete] = useState<{ id: string; name: string } | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Orçamento"
        subtitle="Renda, contas fixas e o que já foi pago em cada mês."
        action={
          <Button variant="primary" onClick={() => setFocusId(budget.addPeriod())}>
            <Plus /> Novo período
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={<Wallet />} label="Renda total" value={fmtBRL(totals.income)} />
        <Stat icon={<Receipt />} label="Contas fixas" value={fmtBRL(totals.bills)} />
        <Stat
          icon={<PiggyBank />}
          label="Sobra mensal"
          value={fmtBRL(totals.left)}
          tone={totals.left < 0 ? 'danger' : totals.left > 0 ? 'success' : 'ink'}
        />
      </div>

      <Card>
        <h3 className="mb-3 font-display font-semibold">Progresso por mês</h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {monthStats.map((m) => (
            <div
              key={m.key}
              className={cx(
                'rounded-xl border p-2.5',
                m.num === currentMonth ? 'border-ember/60 bg-ember/5' : 'border-line/70 bg-bg/30',
              )}
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">{m.label}</div>
              <div className={cx('my-1 font-display text-lg font-semibold tabular-nums', m.pct === 100 && 'text-success')}>
                {m.pct}%
              </div>
              <Progress value={m.pct / 100} color={m.pct === 100 ? 'success' : 'ember'} label={`${m.full}: ${m.pct}% pago`} />
              <div className="mt-1.5 text-[11px] text-faint">
                {m.paidCount}/{m.count} pagas
              </div>
            </div>
          ))}
        </div>
      </Card>

      {periods.length === 0 ? (
        <EmptyState
          icon={<CalendarClock />}
          title="Nenhum período de pagamento"
          text="Crie um período para cada data em que você recebe (ex.: dia 5 e dia 20) e adicione as contas fixas de cada um."
          action={
            <Button variant="primary" onClick={() => setFocusId(budget.addPeriod())}>
              <Plus /> Criar primeiro período
            </Button>
          }
        />
      ) : (
        periods.map((p) => {
          const billsTotal = sum(p.bills.map((b) => b.amount || 0));
          const left = (p.income || 0) - billsTotal;
          return (
            <Card key={p.id} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ember/10 text-ember">
                  <CalendarClock className="size-5" />
                </div>
                <TextField
                  aria-label="Nome do período"
                  value={p.name}
                  placeholder="Ex.: Salário dia 5"
                  onChange={(e) => budget.updatePeriod(p.id, { name: e.target.value })}
                  className="min-w-0 flex-1 font-display text-lg font-semibold"
                  autoFocus={focusId === p.id}
                />
                <IconButton
                  label={`Excluir período ${p.name}`}
                  tone="danger"
                  onClick={() => setPeriodToDelete({ id: p.id, name: p.name || 'Período sem nome' })}
                >
                  <Trash2 />
                </IconButton>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <label className="block">
                  <FieldLabel>Dia do pagamento</FieldLabel>
                  <NumberField
                    boxed
                    decimals={0}
                    placeholder="5"
                    value={p.day}
                    onChange={(v) => budget.updatePeriod(p.id, { day: v == null ? null : clamp(Math.round(v), 1, 31) })}
                  />
                </label>
                <label className="block">
                  <FieldLabel>Renda</FieldLabel>
                  <NumberField boxed money value={p.income} onChange={(v) => budget.updatePeriod(p.id, { income: v ?? 0 })} />
                </label>
                <div>
                  <FieldLabel>Contas</FieldLabel>
                  <div className="flex min-h-11 items-center px-1 font-semibold tabular-nums">{fmtBRL(billsTotal)}</div>
                </div>
                <div>
                  <FieldLabel>Sobra</FieldLabel>
                  <div
                    className={cx(
                      'flex min-h-11 items-center px-1 font-semibold tabular-nums',
                      left < 0 ? 'text-danger' : 'text-success',
                    )}
                  >
                    {fmtBRL(left)}
                  </div>
                </div>
              </div>

              <div className="scroll-x -mx-4 px-4 sm:-mx-5 sm:px-5">
                <table className="w-full min-w-[780px] border-separate border-spacing-0 text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-faint">
                      <th scope="col" className="sticky left-0 z-10 bg-surface py-2 pl-3 font-medium">
                        Conta
                      </th>
                      <th scope="col" className="w-40 py-2 pl-3 font-medium">
                        Valor
                      </th>
                      {MONTHS.map((m) => (
                        <th
                          key={m.key}
                          scope="col"
                          className={cx('w-14 py-2 text-center font-medium', m.num === currentMonth && 'text-ember')}
                        >
                          {m.label}
                        </th>
                      ))}
                      <th scope="col" className="w-12">
                        <span className="sr-only">Excluir</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.bills.length === 0 && (
                      <tr>
                        <td colSpan={MONTHS.length + 3} className="border-t border-line/60 py-6 text-center text-muted">
                          Nenhuma conta neste período ainda.
                        </td>
                      </tr>
                    )}
                    {p.bills.map((b) => (
                      <tr key={b.id}>
                        <td className="sticky left-0 z-10 min-w-48 border-t border-line/60 bg-surface py-1 pr-2">
                          <TextField
                            aria-label="Nome da conta"
                            placeholder="Ex.: Aluguel"
                            value={b.name}
                            autoFocus={focusId === b.id}
                            onChange={(e) => budget.updateBill(p.id, b.id, { name: e.target.value })}
                          />
                        </td>
                        <td className="border-t border-line/60 py-1 pr-2">
                          <NumberField
                            money
                            aria-label={`Valor de ${b.name || 'conta'}`}
                            value={b.amount}
                            onChange={(v) => budget.updateBill(p.id, b.id, { amount: v ?? 0 })}
                          />
                        </td>
                        {MONTHS.map((m) => (
                          <td key={m.key} className="border-t border-line/60 text-center">
                            <CheckBox
                              checked={budget.isPaid(b.id, m.key)}
                              onChange={() => budget.togglePaid(b.id, m.key)}
                              label={`${b.name || 'Conta'} paga em ${m.full}`}
                              color="ember"
                            />
                          </td>
                        ))}
                        <td className="border-t border-line/60 text-center">
                          <IconButton
                            label={`Excluir conta ${b.name || 'sem nome'}`}
                            tone="danger"
                            onClick={() => setBillToDelete({ pid: p.id, bid: b.id, name: b.name || 'Conta sem nome' })}
                          >
                            <Trash2 />
                          </IconButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button onClick={() => setFocusId(budget.addBill(p.id))}>
                <Plus /> Adicionar conta
              </Button>
            </Card>
          );
        })
      )}

      <ConfirmDialog
        open={!!billToDelete}
        title="Excluir esta conta?"
        highlight={billToDelete?.name}
        description="A conta e as marcações de pago dela serão apagadas."
        onCancel={() => setBillToDelete(null)}
        onConfirm={() => {
          if (billToDelete) budget.removeBill(billToDelete.pid, billToDelete.bid);
          setBillToDelete(null);
        }}
      />
      <ConfirmDialog
        open={!!periodToDelete}
        title="Excluir este período?"
        highlight={periodToDelete?.name}
        description="O período e todas as contas dele serão apagados."
        onCancel={() => setPeriodToDelete(null)}
        onConfirm={() => {
          if (periodToDelete) budget.removePeriod(periodToDelete.id);
          setPeriodToDelete(null);
        }}
      />
    </div>
  );
}
