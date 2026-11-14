"use client";

import { Button, Checkbox, Icon } from "@/shared/components/atoms";
import { Modal } from "@/shared/components/molecules";

import { useLevelUpModal } from "./LevelUpModal.hook";
import type { LevelUpModalProps } from "./LevelUpModal.types";

export function LevelUpModal({
  open,
  sheet,
  loading,
  error,
  onClose,
  onConfirm,
}: LevelUpModalProps) {
  const { addToCurrent, setAddToCurrent, preview, confirm } = useLevelUpModal({ sheet, onConfirm });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Subir de nível"
      description="Os dados são rolados pelo servidor e a mesa vê o resultado."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={confirm}
            loading={loading}
            loadingLabel="Rolando..."
            disabled={preview.atMax}
            icon={<Icon name="dices" size={14} />}
          >
            Rolar e subir para o nível {preview.level.to}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-4 font-serif">
          <span className="flex h-16 w-16 items-center justify-center border border-white/15 bg-black/40 text-3xl text-muted-strong">
            {preview.level.from}
          </span>
          <Icon name="chevrons-up" size={28} className="rotate-90 text-teal-300" />
          <span className="flex h-16 w-16 items-center justify-center border border-teal-400/70 bg-teal-900/30 text-3xl text-teal-100 shadow-[0_0_18px_rgba(45,212,191,0.35)]">
            {preview.level.to}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-primary/40 bg-primary/10 p-4">
            <p className="font-sans text-xs font-bold tracking-wider text-accent-text uppercase">
              Vida máxima
            </p>
            <p className="mt-1 font-sans text-sm text-muted-strong">
              Atual {preview.health.max ?? 0} · ganha{" "}
              <span className="text-foreground">{preview.lifeDie}</span>
            </p>
            <p className="mt-1 font-sans text-[13px] text-muted-strong">
              Dado de Vida da classe, já com o modificador de CON.
            </p>
          </div>
          <div className="border border-teal-500/40 bg-teal-900/20 p-4">
            <p className="font-sans text-xs font-bold tracking-wider text-teal-300 uppercase">
              Sanidade máxima
            </p>
            <p className="mt-1 font-sans text-sm text-muted-strong">
              Atual {preview.sanity.max ?? 0} · ganha{" "}
              <span className="text-foreground">{preview.sanityDie}</span>
            </p>
            <p className="mt-1 font-sans text-[13px] text-muted-strong">
              Dado de Sanidade, já com o modificador de SAB.
            </p>
          </div>
        </div>
        <table className="w-full font-sans text-sm">
          <caption className="sr-only">O que muda no próximo nível</caption>
          <thead>
            <tr className="text-left text-xs tracking-wider text-label uppercase">
              <th scope="col" className="pb-2 font-semibold">
                Também muda
              </th>
              <th scope="col" className="pb-2 font-semibold">
                Agora
              </th>
              <th scope="col" className="pb-2 font-semibold">
                Nível {preview.level.to}
              </th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <th scope="row" className="py-2 text-left font-normal text-muted-strong">
                  {row.label}
                </th>
                <td className="py-2 text-foreground">{row.from}</td>
                <td
                  className={`py-2 ${row.from === row.to ? "text-foreground" : "font-semibold text-teal-200"}`}
                >
                  {row.to}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Checkbox
          checked={addToCurrent}
          onCheckedChange={setAddToCurrent}
          label="Somar também na Vida e Sanidade atuais"
        />
        {preview.atMax && (
          <p className="font-sans text-sm text-error">O personagem já está no nível máximo.</p>
        )}
        {error && (
          <p role="alert" className="font-sans text-sm font-semibold text-error">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
