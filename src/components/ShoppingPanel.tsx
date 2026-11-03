import { useMemo, useState } from 'react';
import { CircleCheck, Eraser, Plus, RotateCcw, ShoppingCart, Trash2, Wallet } from 'lucide-react';
import { useShopping } from '../hooks/use-shopping';
import { CATEGORIES, UNITS, type ShopFilter } from '../lib/shopping-data';
import { cx, fmtBRL } from '../lib/utils';
import {
  Button,
  Card,
  CheckBox,
  ConfirmDialog,
  EmptyState,
  IconButton,
  NumberField,
  PanelHeader,
  Segmented,
  Stat,
  TextField,
} from './ui';

export function ShoppingPanel() {
  const s = useShopping();
  const [filter, setFilter] = useState<ShopFilter>('all');
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const visible = useMemo(
    () => s.items.filter((i) => (filter === 'all' ? true : filter === 'pending' ? !i.bought : i.bought)),
    [s.items, filter],
  );

  const addItem = () => {
    setFilter((f) => (f === 'bought' ? 'all' : f));
    setFocusId(s.add());
  };

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Compras"
        subtitle="O Preço Real é o valor fixo do item — não multiplica pela quantidade."
        action={
          <Button variant="primary" onClick={addItem}>
            <Plus /> Novo item
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat icon={<ShoppingCart />} label="Itens" value={s.stats.count} hint={`${s.stats.boughtCount} comprados`} />
        <Stat icon={<Wallet />} label="Total" value={fmtBRL(s.stats.total)} tone="ember" />
        <div className="col-span-2 sm:col-span-1">
          <Stat icon={<CircleCheck />} label="Falta comprar" value={fmtBRL(s.stats.remaining)} hint={`já no carrinho: ${fmtBRL(s.stats.boughtTotal)}`} />
        </div>
      </div>

      {s.items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart />}
          title="Lista de compras vazia"
          text="Adicione os itens com categoria, quantidade e o preço real. O total aparece na hora."
          action={
            <Button variant="primary" onClick={addItem}>
              <Plus /> Adicionar item
            </Button>
          }
        />
      ) : (
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Segmented<ShopFilter>
              label="Filtrar itens"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'Todos' },
                { value: 'pending', label: 'Pendentes' },
                { value: 'bought', label: 'Comprados' },
              ]}
            />
            <div className="flex gap-1">
              <Button variant="ghost" onClick={s.uncheckAll} disabled={s.stats.boughtCount === 0}>
                <RotateCcw /> Desmarcar
              </Button>
              <Button variant="ghost" onClick={() => setConfirmClear(true)} disabled={s.stats.boughtCount === 0}>
                <Eraser /> Limpar comprados
              </Button>
            </div>
          </div>

          <datalist id="shop-categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="scroll-x -mx-4 px-4 sm:-mx-5 sm:px-5">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-faint">
                  <th scope="col" className="w-12"><span className="sr-only">Comprado</span></th>
                  <th scope="col" className="py-2 pl-3 font-medium">Item</th>
                  <th scope="col" className="w-40 py-2 pl-3 font-medium">Categoria</th>
                  <th scope="col" className="w-20 py-2 pl-3 font-medium">Qtd</th>
                  <th scope="col" className="w-24 py-2 pl-3 font-medium">Unid.</th>
                  <th scope="col" className="w-36 py-2 pl-3 font-medium">Preço Real</th>
                  <th scope="col" className="w-12"><span className="sr-only">Excluir</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={7} className="border-t border-line/60 py-6 text-center text-muted">
                      Nada aqui com esse filtro.
                    </td>
                  </tr>
                )}
                {visible.map((i) => (
                  <tr key={i.id} className={cx(i.bought && 'opacity-60')}>
                    <td className="border-t border-line/60 text-center">
                      <CheckBox
                        checked={i.bought}
                        onChange={(v) => s.update(i.id, { bought: v })}
                        label={`Marcar ${i.name || 'item'} como comprado`}
                        color="mint"
                      />
                    </td>
                    <td className="min-w-44 border-t border-line/60 py-1 pr-2">
                      <TextField
                        aria-label="Nome do item"
                        placeholder="Ex.: Arroz"
                        value={i.name}
                        autoFocus={focusId === i.id}
                        onChange={(e) => s.update(i.id, { name: e.target.value })}
                        className={cx(i.bought && 'line-through')}
                      />
                    </td>
                    <td className="border-t border-line/60 py-1 pr-2">
                      <TextField
                        aria-label="Categoria"
                        list="shop-categories"
                        placeholder="Categoria"
                        value={i.category}
                        onChange={(e) => s.update(i.id, { category: e.target.value })}
                      />
                    </td>
                    <td className="border-t border-line/60 py-1 pr-2">
                      <NumberField aria-label="Quantidade" decimals={3} value={i.qty} onChange={(v) => s.update(i.id, { qty: v })} />
                    </td>
                    <td className="border-t border-line/60 py-1 pr-2">
                      <select
                        aria-label="Unidade"
                        className="field"
                        value={i.unit}
                        onChange={(e) => s.update(i.id, { unit: e.target.value })}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border-t border-line/60 py-1 pr-2">
                      <NumberField
                        money
                        boxed
                        aria-label={`Preço real de ${i.name || 'item'}`}
                        value={i.price}
                        onChange={(v) => s.update(i.id, { price: v })}
                      />
                    </td>
                    <td className="border-t border-line/60 text-center">
                      <IconButton label={`Excluir ${i.name || 'item'}`} tone="danger" onClick={() => s.remove(i.id)}>
                        <Trash2 />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="border-t border-line pt-3 pl-3 text-right text-sm text-muted">
                    Total ({s.stats.count} {s.stats.count === 1 ? 'item' : 'itens'})
                  </td>
                  <td className="border-t border-line pt-3 pl-3 font-display text-base font-semibold tabular-nums text-ember">
                    {fmtBRL(s.stats.total)}
                  </td>
                  <td className="border-t border-line" />
                </tr>
              </tfoot>
            </table>
          </div>

          <Button onClick={addItem}>
            <Plus /> Adicionar item
          </Button>
        </Card>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Limpar itens comprados?"
        description={`${s.stats.boughtCount} ${s.stats.boughtCount === 1 ? 'item marcado como comprado será removido' : 'itens marcados como comprados serão removidos'} da lista.`}
        confirmLabel="Limpar"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          s.clearBought();
          setConfirmClear(false);
        }}
      />
    </div>
  );
}
