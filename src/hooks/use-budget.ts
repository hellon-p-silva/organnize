import { useCallback, useMemo } from 'react';
import { usePersistentState } from './use-persistent-state';
import { MONTHS, paidKey, type Bill, type PaidMap, type PayPeriod } from '../lib/budget-data';
import { sum, uid } from '../lib/utils';

export function useBudget() {
  const [periods, setPeriods] = usePersistentState<PayPeriod[]>('budget:periods', []);
  const [paid, setPaid] = usePersistentState<PaidMap>('budget:paid', {});

  const totals = useMemo(() => {
    const income = sum(periods.map((p) => p.income || 0));
    const bills = sum(periods.flatMap((p) => p.bills.map((b) => b.amount || 0)));
    return { income, bills, left: income - bills };
  }, [periods]);

  const monthStats = useMemo(() => {
    const all = periods.flatMap((p) => p.bills);
    const total = sum(all.map((b) => b.amount || 0));
    return MONTHS.map((m) => {
      const paidBills = all.filter((b) => paid[paidKey(b.id, m.key)]);
      const paidAmount = sum(paidBills.map((b) => b.amount || 0));
      const pct =
        all.length === 0 ? 0 : total > 0 ? Math.round((paidAmount / total) * 100) : Math.round((paidBills.length / all.length) * 100);
      return { ...m, pct, count: all.length, paidCount: paidBills.length, paidAmount, total };
    });
  }, [periods, paid]);

  const addPeriod = useCallback(() => {
    const id = uid();
    setPeriods((ps) => [...ps, { id, name: `Pagamento ${ps.length + 1}`, day: null, income: 0, bills: [] }]);
    return id;
  }, [setPeriods]);

  const updatePeriod = useCallback(
    (id: string, patch: Partial<Omit<PayPeriod, 'id' | 'bills'>>) =>
      setPeriods((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    [setPeriods],
  );

  const dropPaidFor = useCallback(
    (billIds: string[]) =>
      setPaid((m) => {
        const next = { ...m };
        for (const id of billIds) for (const mo of MONTHS) delete next[paidKey(id, mo.key)];
        return next;
      }),
    [setPaid],
  );

  const removePeriod = useCallback(
    (id: string) => {
      const p = periods.find((x) => x.id === id);
      setPeriods((ps) => ps.filter((x) => x.id !== id));
      if (p) dropPaidFor(p.bills.map((b) => b.id));
    },
    [periods, setPeriods, dropPaidFor],
  );

  const addBill = useCallback(
    (periodId: string) => {
      const id = uid();
      setPeriods((ps) =>
        ps.map((p) => (p.id === periodId ? { ...p, bills: [...p.bills, { id, name: '', amount: 0 }] } : p)),
      );
      return id;
    },
    [setPeriods],
  );

  const updateBill = useCallback(
    (periodId: string, billId: string, patch: Partial<Omit<Bill, 'id'>>) =>
      setPeriods((ps) =>
        ps.map((p) =>
          p.id === periodId ? { ...p, bills: p.bills.map((b) => (b.id === billId ? { ...b, ...patch } : b)) } : p,
        ),
      ),
    [setPeriods],
  );

  const removeBill = useCallback(
    (periodId: string, billId: string) => {
      setPeriods((ps) => ps.map((p) => (p.id === periodId ? { ...p, bills: p.bills.filter((b) => b.id !== billId) } : p)));
      dropPaidFor([billId]);
    },
    [setPeriods, dropPaidFor],
  );

  const isPaid = useCallback((billId: string, month: string) => !!paid[paidKey(billId, month)], [paid]);

  const togglePaid = useCallback(
    (billId: string, month: string) =>
      setPaid((m) => {
        const k = paidKey(billId, month);
        const next = { ...m };
        if (next[k]) delete next[k];
        else next[k] = true;
        return next;
      }),
    [setPaid],
  );

  const resetPaid = useCallback(() => setPaid({}), [setPaid]);

  return {
    periods,
    totals,
    monthStats,
    hasPaid: Object.keys(paid).length > 0,
    addPeriod,
    updatePeriod,
    removePeriod,
    addBill,
    updateBill,
    removeBill,
    isPaid,
    togglePaid,
    resetPaid,
  };
}

export type Budget = ReturnType<typeof useBudget>;
