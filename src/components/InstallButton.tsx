import { useState } from 'react';
import { CircleCheck, Download, Share, SquarePlus } from 'lucide-react';
import { useInstall } from '../hooks/use-install';
import { Modal } from './ui';
import { cx } from '../lib/utils';

/**
 * "header": botão compacto no cabeçalho (telas maiores).
 * "floating": botão grande (56px) fixo no rodapé, só no celular.
 */
export function InstallButton({ variant }: { variant: 'header' | 'floating' }) {
  const { installed, isNative, available, install } = useInstall();
  const [iosHelp, setIosHelp] = useState(false);

  if (isNative) return null;

  if (installed) {
    return variant === 'header' ? (
      <span className="hidden min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-success sm:inline-flex">
        <CircleCheck className="size-4" /> Instalado
      </span>
    ) : null;
  }
  if (!available) return null;

  const onClick = async () => {
    const r = await install();
    if (r === 'ios-help') setIosHelp(true);
  };

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={onClick}
          className="hidden min-h-11 items-center gap-2 rounded-xl border border-ember/40 px-3 text-sm font-semibold text-ember transition hover:bg-ember/10 sm:inline-flex"
        >
          <Download className="size-4" /> Instalar app
        </button>
      ) : (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom),var(--safe-area-inset-bottom,0px))] pt-3 sm:hidden">
          <button
            type="button"
            onClick={onClick}
            className={cx(
              'flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-ember text-base font-bold text-ember-ink',
              'shadow-[0_10px_30px_-8px_var(--color-ember)] ring-2 ring-ember-2/60 transition active:scale-[0.98]',
            )}
          >
            <Download className="size-6" strokeWidth={2.5} /> Instalar app
          </button>
        </div>
      )}

      <Modal open={iosHelp} onClose={() => setIosHelp(false)} title="Instalar no iPhone / iPad" size="sm">
        <ol className="space-y-4 text-sm text-muted">
          <li className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ember">
              <Share className="size-5" />
            </span>
            <span>
              No Safari, toque em <b className="text-ink">Compartilhar</b> na barra inferior.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ember">
              <SquarePlus className="size-5" />
            </span>
            <span>
              Escolha <b className="text-ink">Adicionar à Tela de Início</b> e confirme.
            </span>
          </li>
        </ol>
      </Modal>
    </>
  );
}
